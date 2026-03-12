import chalk from "chalk";

export interface ScrapedContent {
    url: string;
    title: string;
    content: string;
    success: boolean;
}

/**
 * Web scraper tool — fetches and extracts text content from URLs.
 * Uses native fetch API. Strips HTML tags for clean text extraction.
 */
export class WebScraper {
    private maxContentLength: number;

    constructor(maxContentLength = 3000) {
        this.maxContentLength = maxContentLength;
    }

    async scrape(url: string): Promise<ScrapedContent> {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "AutoResearch-Agent/2.0 (research bot)",
                },
            });
            clearTimeout(timeout);

            if (!response.ok) {
                return { url, title: "", content: "", success: false };
            }

            const html = await response.text();

            // Extract title
            const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/is);
            const title = titleMatch ? titleMatch[1].trim() : "Untitled";

            // Strip HTML tags and extract text
            const content = this.extractText(html);

            return {
                url,
                title,
                content: content.slice(0, this.maxContentLength),
                success: true,
            };
        } catch {
            return { url, title: "", content: "", success: false };
        }
    }

    async scrapeMultiple(urls: string[]): Promise<ScrapedContent[]> {
        const results = await Promise.allSettled(
            urls.map((url) => this.scrape(url))
        );

        return results
            .filter((r): r is PromiseFulfilledResult<ScrapedContent> => r.status === "fulfilled")
            .map((r) => r.value)
            .filter((r) => r.success);
    }

    private extractText(html: string): string {
        return html
            .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
            .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
            .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, "")
            .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, "")
            .replace(/<[^>]+>/g, " ")
            .replace(/\s+/g, " ")
            .trim();
    }
}
