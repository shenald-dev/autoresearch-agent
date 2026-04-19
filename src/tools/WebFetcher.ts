import * as dns from "node:dns/promises";
import * as url from "node:url";
import * as ipaddr from "ipaddr.js";

export class WebFetcher {
	private cache: Map<string, Promise<string>>;
	private hostValidationCache: Map<string, Promise<boolean>>;
	private maxConcurrency: number;

	constructor(maxConcurrency = 3) {
		this.cache = new Map();
		this.hostValidationCache = new Map();
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

			// dns.lookup does not support bracketed IPv6 literals, so we must strip them.
			if (hostname.startsWith("[") && hostname.endsWith("]")) {
				hostname = hostname.slice(1, -1);
			}

			if (this.hostValidationCache.has(hostname)) {
				return this.hostValidationCache.get(hostname) as Promise<boolean>;
			}

			const validationPromise = (async () => {
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
						const parsedIp = ipaddr.parse(address);
						let range = parsedIp.range();

						// Handle IPv4-mapped IPv6 addresses specifically
						if (
							parsedIp.kind() === "ipv6" &&
							(parsedIp as ipaddr.IPv6).isIPv4MappedAddress()
						) {
							range = (parsedIp as ipaddr.IPv6).toIPv4Address().range();
						}

						// Reject private, loopback, linkLocal, uniqueLocal, reserved, unspecified, broadcast
						if (
							[
								"private",
								"loopback",
								"linkLocal",
								"uniqueLocal",
								"reserved",
								"unspecified",
								"broadcast",
							].includes(range) ||
							address === "0.0.0.0" ||
							address === "255.255.255.255"
						) {
							return false;
						}
					} catch {
						// Invalid IP format
						return false;
					}
				}

				return true;
			})();

			this.hostValidationCache.set(hostname, validationPromise);

			validationPromise.finally(() => {
				this.hostValidationCache.delete(hostname);
			});

			return validationPromise;
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
				this.cache.delete(targetUrl);
				return `Error: Invalid or insecure URL provided (${targetUrl})`;
			}

			let response: Response | null = null;
			try {
				let currentUrl = targetUrl;
				let redirects = 0;
				const MAX_REDIRECTS = 5;
				const abortSignal = AbortSignal.timeout(15000);

				while (redirects <= MAX_REDIRECTS) {
					response = await fetch(currentUrl, {
						headers: { "User-Agent": "AutoResearchAgent/2.0" },
						signal: abortSignal,
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

				const contentType = (
					response.headers.get("content-type") || ""
				).toLowerCase();
				if (
					contentType.includes("application/pdf") ||
					contentType.includes("image/") ||
					contentType.includes("video/")
				) {
					console.warn(
						`[WebFetcher] Aborted fetch for ${targetUrl} due to unsupported content type: ${contentType}`,
					);
					await response.body?.cancel().catch(() => {});
					this.cache.delete(targetUrl);
					return `Error: Unsupported content type (${contentType}) from ${targetUrl}`;
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
					.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, "")
					.replace(/<[^>]+>/g, " ")
					.replace(/\s+/g, " ")
					.trim();

				const truncated = strippedText.slice(0, 8000); // Prevent context window explosion
				return truncated;
			} catch (error: unknown) {
				await response?.body?.cancel().catch(() => {});
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

		const uniqueUrls = Array.from(new Set(urls));

		for (const targetUrl of uniqueUrls) {
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
