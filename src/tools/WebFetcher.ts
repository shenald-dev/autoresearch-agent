import * as dns from "node:dns/promises";
import * as url from "node:url";

export class WebFetcher {
	private cache: Map<string, Promise<string>>;
	private maxConcurrency: number;

	constructor(maxConcurrency = 3) {
		this.cache = new Map();
		this.maxConcurrency = maxConcurrency;
	}

	/**
	 * Validates a URL to ensure it is safe (SSRF protection).
	 * Only allows http and https protocols.
	 * Performs DNS resolution to prevent DNS rebinding and loopback variants.
	 */
	private async isValidUrl(targetUrl: string): Promise<boolean> {
		try {
			const parsed = new url.URL(targetUrl);

			// Rejects file://, ftp://, gopher://, etc.
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
				return false;
			}

			const hostname = parsed.hostname;

			// Resolve the hostname to prevent DNS rebinding or obfuscated IP representations
			let addresses: { address: string; family: number }[];
			try {
				addresses = await dns.lookup(hostname, { all: true });
			} catch {
				// If DNS lookup fails (e.g., domain doesn't exist), we can't fetch it anyway
				return false;
			}

			for (const { address } of addresses) {
				// Reject IPv4 private, loopback, metadata, and broadcast ranges
				if (
					address.match(/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) ||
					address.match(/^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/) ||
					address.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\.\d{1,3}\.\d{1,3}$/) ||
					address.match(/^192\.168\.\d{1,3}\.\d{1,3}$/) ||
					address.match(/^169\.254\.\d{1,3}\.\d{1,3}$/) ||
					address === "0.0.0.0" ||
					address === "255.255.255.255"
				) {
					return false;
				}

				// Reject IPv6 loopback, unspecified, unique local, and link local ranges
				const ipv6 = address.toLowerCase();
				if (
					ipv6 === "::1" ||
					ipv6 === "::" ||
					ipv6.startsWith("fc") ||
					ipv6.startsWith("fd") ||
					ipv6.startsWith("fe8") ||
					ipv6.startsWith("fe9") ||
					ipv6.startsWith("fea") ||
					ipv6.startsWith("feb") ||
					ipv6.startsWith("::ffff:127.") ||
					ipv6.startsWith("::ffff:10.") ||
					ipv6.startsWith("::ffff:192.168.") ||
					ipv6.startsWith("::ffff:169.254.") ||
					ipv6.startsWith("::ffff:172.")
				) {
					return false;
				}
			}

			return true;
		} catch {
			return false;
		}
	}

	/**
	 * Internal generic fetcher handling a single URL with error catching.
	 */
	private fetchSingle(targetUrl: string): Promise<string> {
		if (this.cache.has(targetUrl)) {
			return this.cache.get(targetUrl) as Promise<string>;
		}

		const fetchPromise = (async () => {
			if (!(await this.isValidUrl(targetUrl))) {
				return `Error: Invalid or insecure URL provided (${targetUrl})`;
			}

			try {
				let currentUrl = targetUrl;
				let response: Response | null = null;
				let redirects = 0;
				const MAX_REDIRECTS = 5;

				while (redirects <= MAX_REDIRECTS) {
					response = await fetch(currentUrl, {
						headers: { "User-Agent": "AutoResearchAgent/2.0" },
						signal: AbortSignal.timeout(15000),
						redirect: "manual",
					});

					// Handle redirects manually to prevent SSRF via 301/302 location headers
					if (
						response.status >= 300 &&
						response.status < 400 &&
						response.headers.has("location")
					) {
						redirects++;
						if (redirects > MAX_REDIRECTS) {
							this.cache.delete(targetUrl);
							return `Error: Too many redirects for ${targetUrl}`;
						}

						const location = response.headers.get("location") as string;
						const nextUrl = new url.URL(location, currentUrl).toString();

						if (!(await this.isValidUrl(nextUrl))) {
							this.cache.delete(targetUrl);
							return `Error: Redirected to invalid or insecure URL (${nextUrl})`;
						}

						currentUrl = nextUrl;
					} else {
						break;
					}
				}

				if (!response || !response.ok) {
					this.cache.delete(targetUrl);
					return `Error: HTTP ${response?.status || "unknown"} from ${targetUrl}`;
				}

				const text = await response.text();

				// Basic HTML to Text stripping (a real app would use cheerio or html-to-text)
				const strippedText = text
					.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
					.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "")
					.replace(/<[^>]+>/g, " ")
					.replace(/\s+/g, " ")
					.trim();

				const truncated = strippedText.slice(0, 8000); // Prevent context window explosion
				return truncated;
			} catch (error: unknown) {
				this.cache.delete(targetUrl);
				return `Error: Failed to fetch ${targetUrl} - ${error instanceof Error ? error.message : String(error)}`;
			}
		})();

		this.cache.set(targetUrl, fetchPromise);
		return fetchPromise;
	}

	/**
	 * Fetches multiple URLs with bounded concurrency.
	 */
	public async fetchBatch(urls: string[]): Promise<Map<string, string>> {
		const results = new Map<string, string>();
		const executing = new Set<Promise<void>>();

		for (const targetUrl of urls) {
			const promise = this.fetchSingle(targetUrl)
				.then((content) => {
					results.set(targetUrl, content);
				})
				.finally(() => {
					executing.delete(promise);
				});

			executing.add(promise);

			if (executing.size >= this.maxConcurrency) {
				await Promise.race(executing);
			}
		}

		await Promise.all(executing);
		return results;
	}
}
