import pc from "picocolors";
import * as p from "@clack/prompts";
import { ConfigManager } from "../utils/config";

export interface SearchResult {
	title: string;
	link: string;
	snippet: string;
}

export class GoogleSearcher {
	private configManager: ConfigManager;

	constructor() {
		this.configManager = new ConfigManager();
	}

	/**
	 * Executes an API call with exponential backoff and retries.
	 */
	private async withRetries<T>(
		operation: () => Promise<T>,
		maxRetries = 3,
	): Promise<T> {
		let attempt = 0;
		while (attempt < maxRetries) {
			try {
				return await operation();
			} catch (error: any) {
				attempt++;
				if (attempt === maxRetries) {
					throw error;
				}

				// Exponential backoff: 1s, 2s, 4s
				const delayMs = Math.pow(2, attempt - 1) * 1000;
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
		throw new Error("Max retries exceeded.");
	}

	/**
	 * Performs a Google search using Serper.dev API.
	 */
	public async search(query: string, numResults = 5): Promise<SearchResult[]> {
		const apiKey = await this.configManager.get("SERPER_API_KEY");

		if (!apiKey) {
			p.log.warn(
				pc.yellow(
					`[Search] SERPER_API_KEY not found. Skipping web search phase.`,
				),
			);
			return [];
		}

		return this.withRetries(async () => {
			const response = await fetch("https://google.serper.dev/search", {
				method: "POST",
				headers: {
					"X-API-KEY": apiKey,
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					q: query,
					num: numResults,
				}),
			});

			if (!response.ok) {
				throw new Error(`Serper API HTTP error: ${response.status}`);
			}

			const data = await response.json();

			if (!data.organic || !Array.isArray(data.organic)) {
				return [];
			}

			return data.organic.map((item: any) => ({
				title: item.title,
				link: item.link,
				snippet: item.snippet,
			}));
		});
	}
}
