import * as p from "@clack/prompts";
import pc from "picocolors";
import { ConfigManager } from "../utils/config";
import type { ISearchProvider, SearchResult } from "./search/types";

class HttpError extends Error {
	constructor(
		message: string,
		public status: number,
	) {
		super(message);
		this.name = "HttpError";
	}
}

export class GoogleSearcher implements ISearchProvider {
	public readonly name = "GoogleSerper";
	private configManager: ConfigManager;
	private cache: Map<string, Promise<SearchResult[]>>;

	constructor(configManager?: ConfigManager) {
		this.configManager = configManager || new ConfigManager();
		this.cache = new Map();
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
			} catch (error: unknown) {
				attempt++;

				if (
					error instanceof HttpError &&
					error.status >= 400 &&
					error.status < 500 &&
					error.status !== 429
				) {
					throw error; // Fail fast on client errors (e.g., 401, 403, 404)
				}

				if (attempt === maxRetries) {
					console.error(
						`[GoogleSearcher] Max retries exceeded. Error: ${error instanceof Error ? error.message : String(error)}`,
					);
					throw error;
				}

				console.warn(
					`[GoogleSearcher] Attempt ${attempt} failed. Retrying in ${2 ** (attempt - 1)}s... Error: ${error instanceof Error ? error.message : String(error)}`,
				);

				// Exponential backoff: 1s, 2s, 4s
				const delayMs = 2 ** (attempt - 1) * 1000;
				await new Promise((resolve) => setTimeout(resolve, delayMs));
			}
		}
		throw new Error("Max retries exceeded.");
	}

	/**
	 * Performs a Google search using Serper.dev API.
	 */
	public async search(query: string, numResults = 5): Promise<SearchResult[]> {
		const trimmedQuery = query.trim();
		if (!trimmedQuery) {
			return [];
		}

		const cacheKey = `${trimmedQuery}:${numResults}`;
		if (this.cache.has(cacheKey)) {
			return this.cache.get(cacheKey) as Promise<SearchResult[]>;
		}

		const searchPromise = (async () => {
			try {
				const apiKey = await this.configManager.get("SERPER_API_KEY");

				if (!apiKey) {
					p.log.warn(
						pc.yellow(
							"[Search] SERPER_API_KEY not found. Skipping web search phase.",
						),
					);
					return [];
				}

				return await this.withRetries(async () => {
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
						signal: AbortSignal.timeout(10000),
					});

					if (!response.ok) {
						try {
							await response.body?.cancel();
						} catch (err) {}

						throw new HttpError(
							`Serper API HTTP error: ${response.status} - ${response.statusText}`,
							response.status,
						);
					}

					const data = await response.json();

					if (!data.organic || !Array.isArray(data.organic)) {
						return [];
					}

					return data.organic
						.filter(
							(item: Record<string, unknown>) =>
								Boolean(item) &&
								typeof item.link === "string" &&
								item.link.trim() !== "",
						)
						.map((item: Record<string, unknown>) => ({
							title:
								typeof item.title === "string"
									? item.title
									: item.title != null
										? String(item.title)
										: "",
							link: String(item.link).trim(),
							snippet:
								typeof item.snippet === "string"
									? item.snippet
									: item.snippet != null
										? String(item.snippet)
										: "",
						}));
				});
			} catch (error) {
				console.error(
					`[GoogleSearcher] Search failed for query "${query}": ${error instanceof Error ? error.message : String(error)}`,
				);
				this.cache.delete(cacheKey);
				throw error;
			}
		})();

		this.cache.set(cacheKey, searchPromise);
		return searchPromise;
	}
}
