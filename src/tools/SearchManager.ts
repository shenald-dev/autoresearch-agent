import { ConfigManager } from "../utils/config";
import { DuckDuckGoSearcher } from "./DuckDuckGoSearcher";
import { GoogleSearcher } from "./GoogleSearcher";
import type { ISearchProvider, SearchResult } from "./search/types";

export class SearchManager implements ISearchProvider {
	public readonly name = "SearchManager";
	private configManager: ConfigManager;
	private googleSearcher: GoogleSearcher;
	private ddgSearcher: DuckDuckGoSearcher;

	constructor(configManager?: ConfigManager) {
		this.configManager = configManager || new ConfigManager();
		this.googleSearcher = new GoogleSearcher(this.configManager);
		this.ddgSearcher = new DuckDuckGoSearcher();
	}

	public async search(query: string, numResults = 5): Promise<SearchResult[]> {
		const trimmed = query.trim();
		if (!trimmed) return [];

		const serperKey = await this.configManager.get("SERPER_API_KEY");

		if (serperKey) {
			try {
				const results = await this.googleSearcher.search(trimmed, numResults);
				if (results.length > 0) {
					return results;
				}
			} catch (err) {
				// Fallback to DuckDuckGo if Serper fails or rate-limits
			}
		}

		// Fallback to zero-config DuckDuckGo provider
		return await this.ddgSearcher.search(trimmed, numResults);
	}

	/**
	 * Executes multiple investigative search queries concurrently,
	 * deduplicating the aggregated results across queries by normalized URL.
	 */
	public async searchMulti(
		queries: string[],
		numPerQuery = 4,
	): Promise<SearchResult[]> {
		const uniqueQueries = Array.from(
			new Set(queries.map((q) => q.trim()).filter(Boolean)),
		);
		if (uniqueQueries.length === 0) return [];

		const searchPromises = uniqueQueries.map((q) =>
			this.search(q, numPerQuery),
		);
		const nestedResults = await Promise.all(searchPromises);

		const seenUrls = new Set<string>();
		const aggregated: SearchResult[] = [];

		for (const results of nestedResults) {
			for (const r of results) {
				let normalized = r.link;
				try {
					const parsed = new URL(r.link);
					parsed.hash = "";
					normalized = parsed.toString();
				} catch {}

				if (!seenUrls.has(normalized)) {
					seenUrls.add(normalized);
					aggregated.push(r);
				}
			}
		}

		return aggregated;
	}
}
