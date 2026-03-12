import chalk from "chalk";

export interface SearchResult {
    title: string;
    link: string;
    snippet: string;
}

/**
 * Web search tool — wraps SerpAPI or returns mock results as fallback.
 */
export class WebSearch {
    private apiKey: string | undefined;

    constructor() {
        this.apiKey = process.env.SERPAPI_KEY;
    }

    async search(query: string, maxResults = 5): Promise<SearchResult[]> {
        if (!this.apiKey || this.apiKey === "your_serpapi_key") {
            return this.mockSearch(query, maxResults);
        }

        try {
            const url = `https://serpapi.com/search.json?q=${encodeURIComponent(query)}&api_key=${this.apiKey}&num=${maxResults}`;
            const response = await fetch(url);
            const data = await response.json();

            if (!data.organic_results) {
                return this.mockSearch(query, maxResults);
            }

            return data.organic_results.slice(0, maxResults).map((r: any) => ({
                title: r.title || "Untitled",
                link: r.link || "",
                snippet: r.snippet || "",
            }));
        } catch {
            console.log(chalk.yellow("  ⚠ SerpAPI unavailable, using mock search results"));
            return this.mockSearch(query, maxResults);
        }
    }

    private mockSearch(query: string, maxResults: number): SearchResult[] {
        const mockResults: SearchResult[] = [
            {
                title: `${query} — Wikipedia`,
                link: `https://en.wikipedia.org/wiki/${encodeURIComponent(query)}`,
                snippet: `A comprehensive overview of ${query} covering key concepts, history, and current developments.`,
            },
            {
                title: `${query}: A Complete Guide`,
                link: `https://example.com/guide/${encodeURIComponent(query)}`,
                snippet: `Everything you need to know about ${query}, from fundamentals to advanced applications.`,
            },
            {
                title: `Latest Research on ${query}`,
                link: `https://arxiv.org/search/?query=${encodeURIComponent(query)}`,
                snippet: `Recent academic papers and research findings related to ${query}.`,
            },
            {
                title: `${query} — Industry Analysis`,
                link: `https://example.com/analysis/${encodeURIComponent(query)}`,
                snippet: `Market trends, key players, and future outlook for ${query}.`,
            },
            {
                title: `How ${query} Is Changing the World`,
                link: `https://example.com/impact/${encodeURIComponent(query)}`,
                snippet: `The transformative impact of ${query} on technology, society, and business.`,
            },
        ];

        return mockResults.slice(0, maxResults);
    }
}
