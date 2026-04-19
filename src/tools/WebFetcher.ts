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
			if (!(await this.isVal
... (truncated)
}