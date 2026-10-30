import * as dns from "node:dns/promises";
import * as url from "node:url";
import * as ipaddr from "ipaddr.js";
import pLimit from "p-limit";
import { Agent, fetch as undiciFetch } from "undici";
import { extractCharset } from "../utils/http";

export class WebFetcher {
	private cache: Map<string, Promise<string>>;
	private hostValidationCache: Map<string, Promise<string | null>>;
	private maxConcurrency: number;
	private dispatcher?: Agent;

	constructor(maxConcurrency = 3, dispatcher?: Agent) {
		this.cache = new Map();
		this.hostValidationCache = new Map();
		this.maxConcurrency = maxConcurrency;
		this.dispatcher = dispatcher;
	}

	/**
	 * Validates a URL to ensure it is safe (SSRF protection).
	 * Only allows http and https protocols.
	 * Performs DNS resolution to prevent DNS rebinding and loopback variants.
	 */
	private async isValidUrl(targetUrl: string): Promise<string | null> {
		try {
			const parsed = new url.URL(targetUrl);

			// Rejects file://, ftp://, gopher://, etc.
			if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
				return null;
			}

			let hostname = parsed.hostname;

			// dns.lookup does not support bracketed IPv6 literals, so we must strip them.
			if (hostname.startsWith("[") && hostname.endsWith("]")) {
				hostname = hostname.slice(1, -1);
			}

			if (this.hostValidationCache.has(hostname)) {
				return this.hostValidationCache.get(hostname) as Promise<string | null>;
			}

			const validationPromise = (async () => {
				// Resolve the hostname to prevent DNS rebinding or obfuscated IP representations
				let addresses: { address: string; family: number }[];
				try {
					addresses = await dns.lookup(hostname, { all: true });
				} catch {
					// If DNS lookup fails (e.g., domain doesn't exist), we can't fetch it anyway
					return null;
				}

				if (!addresses || addresses.length === 0) {
					return null;
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

						// Strict whitelist: Only allow regular public unicast addresses.
						// This implicitly rejects private, loopback, multicast, broadcast, and metadata ranges.
						if (range === "unicast") {
							return address;
						}
					} catch {
						// Invalid IP format
						return null;
					}
				}

				return null;
			})();

			this.hostValidationCache.set(hostname, validationPromise);

			// Prevent DNS rebinding by only caching in-flight requests (request coalescing)
			validationPromise
				.finally(() => {
					if (this.hostValidationCache.get(hostname) === validationPromise) {
						this.hostValidationCache.delete(hostname);
					}
				})
				.catch(() => {});

			return validationPromise;
		} catch {
			return null;
		}
	}

	/**
	 * Internal generic fetcher handling a single URL with error catching.
	 */
	private fetchSingle(targetUrl: string): Promise<string> {
		// Normalize the target URL early to avoid redundant network requests and duplicate cache entries
		let normalizedUrl = targetUrl;
		try {
			const parsed = new URL(targetUrl);
			parsed.hash = "";
			normalizedUrl = parsed.toString();
		} catch {}

		if (this.cache.has(normalizedUrl)) {
			return this.cache.get(normalizedUrl) as Promise<string>;
		}

		const fetchPromise = (async () => {
			let currentUrl = targetUrl;
			let safeIp = await this.isValidUrl(normalizedUrl);

			if (!safeIp) {
				this.cache.delete(normalizedUrl);

				return `Error: Invalid or insecure URL provided (${targetUrl})`;
			}

			let response: Response | null = null;
			let reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
			const createdDispatchers: Agent[] = [];
			try {
				let redirects = 0;
				const MAX_REDIRECTS = 5;
				const abortSignal = AbortSignal.timeout(15000);

				while (redirects <= MAX_REDIRECTS) {
					const family = safeIp.includes(":") ? 6 : 4;
					// Use the injected dispatcher or construct one that binds the hostname to safeIp
					// We only close the dispatcher if we constructed it ourselves
					const dispatcher =
						this.dispatcher ||
						new Agent({
							connect: {
								lookup: (hostname, options, callback) => {
									callback(null, [{ address: safeIp as string, family }]);
								},
							},
						});

					if (!this.dispatcher) {
						createdDispatchers.push(dispatcher);
					}

					response = (await undiciFetch(currentUrl, {
						headers: { "User-Agent": "AutoResearchAgent/2.0" },
						signal: abortSignal,
						dispatcher,
						redirect: "manual",
					})) as unknown as Response;

					// Handle redirects manually to prevent SSRF via 301/302 location headers
					if (
						response.status >= 300 &&
						response.status < 400 &&
						response.headers.has("location")
					) {
						redirects++;
						if (redirects > MAX_REDIRECTS) {
							try {
								await response.body?.cancel();
							} catch (err) {
								console.warn("WebFetcher cancel error:", err);
							}
							this.cache.delete(normalizedUrl);

							return `Error: Too many redirects for ${targetUrl}`;
						}

						const location = response.headers.get("location") as string;
						const nextUrl = new url.URL(location, currentUrl).toString();

						safeIp = await this.isValidUrl(nextUrl);
						if (!safeIp) {
							try {
								await response.body?.cancel();
							} catch (err) {
								console.warn("WebFetcher cancel error:", err);
							}
							this.cache.delete(normalizedUrl);

							return `Error: Redirected to invalid or insecure URL (${nextUrl})`;
						}

						try {
							await response.body?.cancel();
						} catch (err) {
							console.warn("WebFetcher cancel error:", err);
						}
						currentUrl = nextUrl;
					} else {
						break;
					}
				}

				if (!response || !response.ok) {
					const statusText = response?.statusText || "unknown error";
					console.error(
						`[WebFetcher] HTTP Error ${response?.status || "unknown"} - ${statusText} while fetching ${targetUrl}`,
					);
					try {
						await response?.body?.cancel();
					} catch (err) {
						console.warn("WebFetcher cancel error:", err);
					}
					this.cache.delete(normalizedUrl);

					return `Error: HTTP ${response?.status || "unknown"} from ${targetUrl}`;
				}

				const contentType = (
					response.headers.get("content-type") || ""
				).toLowerCase();
				// Enforce strict allowlist of text-based content types to prevent downloading arbitrary large binaries
				if (
					contentType &&
					!contentType.includes("text/") &&
					!contentType.includes("application/json") &&
					!contentType.includes("application/xml") &&
					!contentType.includes("application/xhtml")
				) {
					try {
						await response.body?.cancel();
					} catch (err) {
						console.warn("WebFetcher cancel error:", err);
					}
					this.cache.delete(normalizedUrl);

					return `Error: Unsupported content type (${contentType}) from ${targetUrl}`;
				}

				let text = "";
				if (response.body) {
					reader = response.body.getReader();
					let decoder: TextDecoder;
					try {
						decoder = new TextDecoder(extractCharset(contentType));
					} catch {
						decoder = new TextDecoder("utf-8");
					}
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
							try {
								await reader.cancel();
							} catch (err) {
								console.warn("WebFetcher cancel error:", err);
							}
							break;
						}
					}
					chunks.push(decoder.decode());
					text = chunks.join("");
				} else {
					text = await response.text();
				}

				// Basic HTML to Text stripping (a real app would use cheerio or html-to-text)
				// Note: Regex-based HTML stripping is limited and can struggle with severely malformed HTML.
				// However, for the scope of extracting textual context for LLMs, these non-greedy regexes
				// combined with the 500KB payload limit provide excellent performance and sufficient reliability
				// without introducing large DOM parsing dependencies (which would impact startup time).
				const strippedText = text
					.replace(/<!--[\s\S]*?-->/g, "") // Remove HTML comments early. Note: Safe because <script>/<style> blocks are removed entirely in the next step.
					.replace(
						/<(script|style|svg|nav|footer|iframe|noscript)\b[^>]*\/>/gi,
						"", // Remove self-closing boilerplate tags first
					)
					.replace(
						/<(script|style|svg|nav|footer|iframe|noscript)\b[^>]*>[\s\S]*?(?:<\/\1\s*>|$)/gi,
						"", // Remove complete and unclosed boilerplate blocks
					)
					.replace(/<[^>]+>|<[^>]*$/g, " ") // Remove complete HTML tags and any trailing partial HTML tag
					.replace(/\s+/g, " ")
					.trim();
				const truncated = strippedText.slice(0, 8000); // Prevent context window explosion
				return truncated;
			} catch (error: unknown) {
				console.error(
					`[WebFetcher] Fetch failed for ${targetUrl}: ${error instanceof Error ? error.message : String(error)}`,
				);
				if (reader) {
					try {
						await reader.cancel();
					} catch (err) {
						console.warn("WebFetcher cancel error:", err);
					}
				} else {
					try {
						await response?.body?.cancel();
					} catch (err) {
						console.warn("WebFetcher cancel error:", err);
					}
				}
				this.cache.delete(normalizedUrl);

				return `Error: Failed to fetch ${targetUrl} - ${error instanceof Error ? error.message : String(error)}`;
			} finally {
				for (const d of createdDispatchers) {
					try {
						await d.close();
					} catch (err) {}
				}
			}
		})();

		this.cache.set(normalizedUrl, fetchPromise);

		return fetchPromise;
	}

	/**
	 * Fetches multiple URLs with bounded concurrency.
	 */
	public async fetchBatch(urls: string[]): Promise<Map<string, string>> {
		const results = new Map<string, string>();

		// Pre-initialize to maintain exact input ranking order
		for (const u of urls) {
			results.set(u, "");
		}

		// Map normalized URL (no hash) to a set of original URLs that requested it
		const normalizedToOriginals = new Map<string, Set<string>>();
		for (const u of urls) {
			try {
				const parsed = new URL(u);
				parsed.hash = "";
				const normalized = parsed.toString();
				if (!normalizedToOriginals.has(normalized)) {
					normalizedToOriginals.set(normalized, new Set());
				}
				normalizedToOriginals.get(normalized)?.add(u);
			} catch {
				// If URL is completely invalid, treat it as its own unique target so it hits the error path
				if (!normalizedToOriginals.has(u)) {
					normalizedToOriginals.set(u, new Set());
				}
				normalizedToOriginals.get(u)?.add(u);
			}
		}

		const limit = pLimit(this.maxConcurrency);
		const tasks = Array.from(normalizedToOriginals.entries()).map(
			([normalizedUrl, originalUrls]) => {
				return limit(async () => {
					const content = await this.fetchSingle(normalizedUrl);
					for (const orig of originalUrls) {
						results.set(orig, content);
					}
				});
			},
		);

		await Promise.all(tasks);
		return results;
	}
}
