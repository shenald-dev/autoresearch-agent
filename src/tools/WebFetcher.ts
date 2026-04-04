import * as dns from "node:dns/promises";
import * as url from "node:url";
import ipaddr from "ipaddr.js";

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

			let hostname = parsed.hostname;

			if (hostname.startsWith("[") && hostname.endsWith("]")) {
				hostname = hostname.slice(1, -1);
			}

			// Resolve the hostname to prevent DNS rebinding or obfuscated IP representations
			let addresses: { address: string; family: number }[];
			try {
				addresses = await dns.lookup(hostname, { all: true });
			} catch {
				// If DNS lookup fails (e.g., domain doesn't exist), we can't fetch it anyway
				return false;
			}

			for (const { address } of addresses) {
				try {
					const ip = ipaddr.parse(address);
					const range = ip.range();

					if (
						range === "private" ||
						range === "loopback" ||
						range === "linkLocal" ||
						range === "uniqueLocal" ||
						range === "unspecified" ||
						range === "broadcast" ||
						range === "carrierGradeNat" ||
						range === "multicast" ||
						range === "reserved"
					) {
						return false;
					}

					if (
						ip.kind() === "ipv6" &&
						(ip as ipaddr.IPv6).isIPv4MappedAddress()
					) {
						const ipv4 = (ip as ipaddr.IPv6).toIPv4Address();
						const ipv4Range = ipv4.range();
						if (
							ipv4Range === "private" ||
							ipv4Range === "loopback" ||
							ipv4Range === "linkLocal" ||
							ipv4Range === "unspecified" ||
							ipv4Range === "broadcast" ||
							ipv4Range === "carrierGradeNat" ||
							ipv4Range === "multicast" ||
							ipv4Range === "reserved"
						) {
							return false;
						}
					}
				} catch {
					// Invalid IP format
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
							await response.body?.cancel().catch(() => {});
							this.cache.delete(targetUrl);
							return `Error: Too many redirects for ${targetUrl}`;
						}

						const location = response.headers.get("location") as string;
						const nextUrl = new url.URL(location, currentUrl).toString();

						if (!(await this.isValidUrl(nextUrl))) {
							await response.body?.cancel().catch(() => {});
							this.cache.delete(targetUrl);
							return `Error: Redirected to invalid or insecure URL (${nextUrl})`;
						}

						await response.body?.cancel().catch(() => {});
						currentUrl = nextUrl;
					} else {
						break;
					}
				}

				if (!response || !response.ok) {
					await response?.body?.cancel().catch(() => {});
					this.cache.delete(targetUrl);
					return `Error: HTTP ${response?.status || "unknown"} from ${targetUrl}`;
				}

				let text = "";
				if (response.body) {
					const reader = response.body.getReader();
					const decoder = new TextDecoder();
					let totalBytes = 0;
					const MAX_BYTES = 500_000; // Limit payload size to avoid OOM
					const chunks: string[] = [];

					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						totalBytes += value.length;
						chunks.push(decoder.decode(value, { stream: true }));

						if (totalBytes >= MAX_BYTES) {
							// Cancel the reader early to save bandwidth and memory
							await reader.cancel();
							break;
						}
					}
					chunks.push(decoder.decode());
					text = chunks.join("");
				} else {
					text = await response.text();
				}

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
