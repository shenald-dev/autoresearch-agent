interface ReportMetadata {
	id: string;
	slug: string;
	topic: string;
	depth: number;
	model: string;
	createdAt: string;
	sourcesCount: number;
}

export interface SourceItem {
	index: number;
	title: string;
	url: string;
	snippet: string;
}

export interface ReportData {
	metadata: ReportMetadata;
	markdown: string;
	sources: SourceItem[];
	subQueries: string[];
	executiveSummary: string;
}

export interface ExportResult {
	format: "markdown" | "html" | "json";
	filePath: string;
	filename: string;
}
