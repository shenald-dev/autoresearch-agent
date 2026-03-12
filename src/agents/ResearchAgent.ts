import chalk from "chalk";
import { WebSearch, SearchResult } from "../tools/WebSearch";
import { WebScraper, ScrapedContent } from "../tools/WebScraper";

export interface ResearchData {
    topic: string;
    sources: Array<{
        title: string;
        link: string;
        snippet: string;
        content: string;
    }>;
    totalSources: number;
}

/**
 * ResearchAgent — searches the web and scrapes content for a given topic.
 */
export class ResearchAgent {
    private search: WebSearch;
    private scraper: WebScraper;
    private maxResults: number;

    constructor() {
        this.search = new WebSearch();
        this.scraper = new WebScraper();
        this.maxResults = parseInt(process.env.MAX_SEARCH_RESULTS || "5", 10);
    }

    async execute(topic: string): Promise<ResearchData> {
        console.log(chalk.gray(`  🔍 Searching for: "${topic}"`));

        // Step 1: Search for relevant sources
        const searchResults = await this.search.search(topic, this.maxResults);
        console.log(chalk.gray(`  📄 Found ${searchResults.length} sources`));

        // Step 2: Scrape content from each URL
        const urls = searchResults.map((r) => r.link).filter(Boolean);
        const scraped = await this.scraper.scrapeMultiple(urls);
        console.log(chalk.gray(`  ✅ Successfully scraped ${scraped.length} pages`));

        // Step 3: Merge search metadata with scraped content
        const sources = searchResults.map((result) => {
            const scrapedMatch = scraped.find((s) => s.url === result.link);
            return {
                title: scrapedMatch?.title || result.title,
                link: result.link,
                snippet: result.snippet,
                content: scrapedMatch?.content || result.snippet,
            };
        });

        return {
            topic,
            sources,
            totalSources: sources.length,
        };
    }
}
