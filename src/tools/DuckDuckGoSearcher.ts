import { fetch as undiciFetch } from "undici";
import type { ISearchProvider, SearchResult } from "./search/types";

function decodeBasicEntities(text: string): string {
	return text
		.replace(/&amp;/g, "&")
		.replace(/&lt;/g, "<")
		.replace(/&gt;/g, ">")
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&apos;/g, "'")
		.replace(/&nbsp;/g, " ")
		.replace(/\s+/g, " ")
		.trim();
}

function cleanHtml(text: string): string {
	return decodeBasicEntities(text.replace(/<[^>]+>/g, " "));
}

export class DuckDuckGoSearcher implements ISearchProvider {
	public readonly name = "DuckDuckGo";
	private cache: Map<string, Promise<SearchResult[]>> = new Map();

	constructor(private maxRetries = 2) {}

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
			let attempt = 0;
			while (attempt <= this.maxRetries) {
				try {
					const encoded = encodeURIComponent(trimmedQuery);
					const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

					const response = await undiciFetch(url, {
						headers: {
							"User-Agent":
								"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
							Accept:
								"text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
							"Accept-Language": "en-US,en;q=0.9",
						},
						signal: AbortSignal.timeout(10000),
					});

					if (!response.ok) {
						throw new Error(`DuckDuckGo HTTP error: ${response.status}`);
					}

					const html = await response.text();
					const results: SearchResult[] = [];

					// Parse title links and snippet blocks
					// Pattern: <a class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>
					const titleRegex =
						/<a[^>]+class="[^"]*result__a[^"]*"[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;
					const snippetRegex =
						/<a[^>]+class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

					const titles: { href: string; title: string }[] = [];
					let titleMatch: RegExpExecArray | null = titleRegex.exec(html);
					while (titleMatch !== null) {
						titles.push({
							href: titleMatch[1],
							title: cleanHtml(titleMatch[2]),
						});
						titleMatch = titleRegex.exec(html);
					}

					const snippets: string[] = [];
					let snippetMatch: RegExpExecArray | null = snippetRegex.exec(html);
					while (snippetMatch !== null) {
						snippets.push(cleanHtml(snippetMatch[1]));
						snippetMatch = snippetRegex.exec(html);
					}

					for (
						let i = 0;
						i < titles.length && results.length < numResults;
						i++
					) {
						let rawLink = titles[i].href;

						// Extract target link from DuckDuckGo redirect wrapper: /l/?uddg=<url>&...
						if (rawLink.includes("uddg=")) {
							const uddgMatch = rawLink.match(/uddg=([^&]+)/);
							if (uddgMatch) {
								try {
									rawLink = decodeURIComponent(uddgMatch[1]);
								} catch {}
							}
						}

						if (rawLink.startsWith("//")) {
							rawLink = `https:${rawLink}`;
						}

						// Validate URL format
						try {
							const parsedUrl = new URL(rawLink);
							if (
								parsedUrl.protocol === "http:" ||
								parsedUrl.protocol === "https:"
							) {
								results.push({
									title: titles[i].title || "Untitled",
									link: parsedUrl.toString(),
									snippet: snippets[i] || "",
								});
							}
						} catch {}
					}

					return results;
				} catch (error) {
					attempt++;
					if (attempt > this.maxRetries) {
						this.cache.delete(cacheKey);
						return [];
					}
					await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
				}
			}

			return [];
		})();

		this.cache.set(cacheKey, searchPromise);
		return searchPromise;
	}
}
