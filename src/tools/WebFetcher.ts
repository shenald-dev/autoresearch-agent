import * as url from "url";

export class WebFetcher {
    private cache: Map<string, string>;
    private maxConcurrency: number;

    constructor(maxConcurrency = 3) {
        this.cache = new Map();
        this.maxConcurrency = maxConcurrency;
    }

    /**
     * Validates a URL to ensure it is safe (SSRF protection).
     * Only allows http and https protocols.
     */
    private isValidUrl(targetUrl: string): boolean {
        try {
            const parsed = new url.URL(targetUrl);
            
            // Rejects file://, ftp://, gopher://, etc.
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                return false;
            }

            // Reject potential internal IP ranges (basic SSRF protection filter)
            const hostname = parsed.hostname;
            if (
                hostname === "localhost" ||
                hostname === "127.0.0.1" ||
                hostname === "::1" ||
                hostname.startsWith("192.168.") ||
                hostname.startsWith("10.") ||
                hostname.match(/^172\.(1[6-9]|2[0-9]|3[0-1])\./)
            ) {
                return false;
            }
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Internal generic fetcher handling a single URL with error catching.
     */
    private async fetchSingle(targetUrl: string): Promise<string> {
        if (!this.isValidUrl(targetUrl)) {
            return `Error: Invalid or insecure URL provided (${targetUrl})`;
        }

        if (this.cache.has(targetUrl)) {
            return this.cache.get(targetUrl) as string;
        }

        try {
            // Wait with a small timeout to simulate actual fetching
            // In a real app, this would use fetch() or puppeteer.
            // But since AutoResearch is an MVP, we will do a real fetch here!
            const response = await fetch(targetUrl, {
                headers: { "User-Agent": "AutoResearchAgent/2.0" }
            });
            
            if (!response.ok) {
                return `Error: HTTP ${response.status} from ${targetUrl}`;
            }

            const text = await response.text();
            
            // Basic HTML to Text stripping (a real app would use cheerio or html-to-text)
            const strippedText = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
                                     .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, "")
                                     .replace(/<[^>]+>/g, " ")
                                     .replace(/\s+/g, " ")
                                     .trim();

            const truncated = strippedText.slice(0, 8000); // Prevent context window explosion
            this.cache.set(targetUrl, truncated);
            return truncated;
        } catch (error: any) {
            return `Error: Failed to fetch ${targetUrl} - ${error.message}`;
        }
    }

    /**
     * Fetches multiple URLs with bounded concurrency.
     */
    public async fetchBatch(urls: string[]): Promise<Map<string, string>> {
        const results = new Map<string, string>();
        const executing = new Set<Promise<void>>();

        for (const targetUrl of urls) {
            const promise = this.fetchSingle(targetUrl).then(content => {
                results.set(targetUrl, content);
            }).finally(() => {
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
