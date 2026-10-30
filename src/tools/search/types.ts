export interface SearchResult {
	title: string;
	link: string;
	snippet: string;
}

export interface ISearchProvider {
	readonly name: string;
	search(query: string, numResults?: number): Promise<SearchResult[]>;
}
