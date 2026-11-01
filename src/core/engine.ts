import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import type { ReportData, SourceItem } from "../exporters/types";
import { GoogleSearcher } from "../tools/GoogleSearcher";
import { SearchManager } from "../tools/SearchManager";
import { WebFetcher } from "../tools/WebFetcher";
import type { SearchResult } from "../tools/search/types";
import { ConfigManager } from "../utils/config";
import { QueryDecomposer } from "./query-decomposer";

export interface EngineConfig {
	depth: number;
	configManager?: ConfigManager;
}

export type StatusCallback = (message: string) => void;

function slugify(text: string): string {
	return (
		text
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, "-")
			.replace(/(^-|-$)+/g, "")
			.slice(0, 50) || "research-report"
	);
}

function generateReportId(): string {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 6);
	return `rep_${timestamp}_${random}`;
}

export class ResearchEngine {
	private config: EngineConfig;
	private configManager: ConfigManager;
	private searcher: GoogleSearcher;
	private searchManager: SearchManager;
	private fetcher: WebFetcher;
	private prompt: PromptTemplate;
	private lastReport: ReportData | null = null;

	constructor(config: EngineConfig) {
		this.config = config;
		this.configManager = config.configManager || new ConfigManager();
		this.searcher = new GoogleSearcher(this.configManager);
		this.searchManager = new SearchManager(this.configManager);
		// Scale max concurrency based on depth to avoid overwhelming systems but speed up deep searches
		this.fetcher = new WebFetcher(Math.min(10, config.depth * 2));

		this.prompt = PromptTemplate.fromTemplate(`
You are an expert autonomous researcher.
Conduct a deep-dive analysis on the following topic.
You have successfully scraped multiple web sources related to the topic.

Topic: {topic}

Sources Data:
{context}

Format the output as a clean, highly structured markdown document.
Include an executive summary, main findings, and a "References" section at the bottom citing the sources provided.
Return ONLY the markdown document.
        `);
	}

	private async initLLM(): Promise<{ llm: ChatOpenAI; modelName: string }> {
		const apiKey = await this.configManager.get("OPENAI_API_KEY");
		if (!apiKey) {
			throw new Error(
				"OPENAI_API_KEY is missing. Please run 'autoresearch auth' to configure it.",
			);
		}

		const baseUrl = await this.configManager.get("OPENAI_BASE_URL");
		const modelName =
			(await this.configManager.get("OPENAI_MODEL")) || "gpt-4-turbo-preview";

		const llm = new ChatOpenAI({
			modelName,
			temperature: 0.2,
			apiKey: apiKey,
			configuration: baseUrl ? { baseURL: baseUrl } : undefined,
		});

		return { llm, modelName };
	}

	public getLastReport(): ReportData | null {
		return this.lastReport;
	}

	/**
	 * Executes the full end-to-end research cycle, returning a structured ReportData object.
	 */
	public async runDetailed(
		topic: string,
		onProgress?: StatusCallback,
	): Promise<ReportData> {
		const updateStatus = (msg: string) => {
			if (onProgress) onProgress(msg);
		};

		const cleanTopic = topic.trim();
		const reportId = generateReportId();
		const slug = `${slugify(cleanTopic)}-${Date.now().toString(36)}`;

		const { llm, modelName } = await this.initLLM();

		// Phase 1: Sub-Query Decomposition
		updateStatus(
			`🔍 Formulating investigation vectors for: "${cleanTopic}"...`,
		);
		const subQueries = await QueryDecomposer.decompose(
			cleanTopic,
			this.config.depth,
			llm,
		);

		// Phase 2: Search Orchestration
		updateStatus(
			`🌐 Searching across ${subQueries.length} investigation vector(s)...`,
		);

		// Execute primary search through searcher (preserves test mock contracts)
		const serperKey = await this.configManager.get("SERPER_API_KEY");
		let searchResults: SearchResult[] = [];

		if (serperKey) {
			try {
				const res = await this.searcher.search(
					cleanTopic,
					this.config.depth * 2,
				);
				if (Array.isArray(res)) {
					searchResults = res;
				}
			} catch {
				// Serper search failed, will evaluate fallback
			}
		}

		// If the Serper search yielded no results (or failed/rate-limited), fallback to DuckDuckGo
		if (searchResults.length === 0) {
			searchResults = await this.searchManager.searchMulti(
				subQueries,
				Math.max(2, this.config.depth),
			);
		} else if (
			searchResults.length > 0 &&
			subQueries.length > 1 &&
			this.config.depth >= 3
		) {
			// For deep research (depth >= 3), supplement with sub-queries
			const secondaryResults = await this.searchManager.searchMulti(
				subQueries.slice(1),
				2,
			);
			searchResults = [...searchResults, ...secondaryResults];
		}

		if (searchResults.length === 0) {
			const emptyReport: ReportData = {
				metadata: {
					id: reportId,
					slug,
					topic: cleanTopic,
					depth: this.config.depth,
					model: modelName,
					createdAt: new Date().toISOString(),
					sourcesCount: 0,
				},
				markdown: `No results found for "${cleanTopic}". The API key may be missing or the query was too niche.`,
				sources: [],
				subQueries,
				executiveSummary: "",
			};
			this.lastReport = emptyReport;
			return emptyReport;
		}

		// Deduplicate search results by canonical normalized URL
		const seenLinks = new Set<string>();
		const uniqueSearchResults = searchResults.filter((r) => {
			let normalized = r.link;
			try {
				const parsed = new URL(r.link);
				parsed.hash = "";
				normalized = parsed.toString();
			} catch {}

			if (seenLinks.has(normalized)) {
				return false;
			}
			seenLinks.add(normalized);
			return true;
		});

		// Phase 3: Fetch and Extract
		updateStatus(
			`📄 Discovered ${uniqueSearchResults.length} sources. Fetching content concurrently...`,
		);
		const urls = uniqueSearchResults.map((r) => r.link);
		const rawFetchResults = await this.fetcher.fetchBatch(urls);
		const fetchResults =
			rawFetchResults instanceof Map ? rawFetchResults : new Map();

		// Phase 4: Synthesize
		updateStatus(
			`🧠 Synthesizing ${fetchResults.size} sources into a final report...`,
		);

		// Build context from results with contiguous source numbering
		const contextChunks: string[] = [];
		const seenContent = new Set<string>();
		const validSources: SourceItem[] = [];
		let sourceIndex = 1;

		for (const [url, content] of fetchResults.entries()) {
			if (!content.startsWith("Error:")) {
				const truncatedContent = content.substring(0, 1500).trim();
				if (truncatedContent && !seenContent.has(truncatedContent)) {
					seenContent.add(truncatedContent);

					// Locate title & snippet from original search results
					const matchedSearch = uniqueSearchResults.find((s) => s.link === url);
					const title = matchedSearch?.title || "Web Source";
					const snippet = matchedSearch?.snippet || "";

					validSources.push({
						index: sourceIndex,
						title,
						url,
						snippet,
					});

					contextChunks.push(
						`[Source ${sourceIndex} | ${url}]\n${truncatedContent}\n\n`,
					);
					sourceIndex++;
				}
			}
		}

		if (contextChunks.length === 0) {
			const failedReport: ReportData = {
				metadata: {
					id: reportId,
					slug,
					topic: cleanTopic,
					depth: this.config.depth,
					model: modelName,
					createdAt: new Date().toISOString(),
					sourcesCount: 0,
				},
				markdown: `No valid content could be extracted from the sources for "${cleanTopic}".`,
				sources: [],
				subQueries,
				executiveSummary: "",
			};
			this.lastReport = failedReport;
			return failedReport;
		}

		const context = contextChunks.join("");
		const chain = this.prompt.pipe(llm);
		const result = await chain.invoke({
			topic: cleanTopic,
			context,
		});

		const markdownOutput = String(result.content);

		// Extract a short executive summary snippet from markdown
		let executiveSummary = "";
		const summaryMatch = markdownOutput.match(
			/(?:executive summary|overview)[\s\S]*?\n\n([\s\S]*?)(?:\n\n#|$)/i,
		);
		if (summaryMatch) {
			executiveSummary = summaryMatch[1]
				.replace(/<[^>]+>/g, "")
				.trim()
				.slice(0, 300);
		}

		const report: ReportData = {
			metadata: {
				id: reportId,
				slug,
				topic: cleanTopic,
				depth: this.config.depth,
				model: modelName,
				createdAt: new Date().toISOString(),
				sourcesCount: validSources.length,
			},
			markdown: markdownOutput,
			sources: validSources,
			subQueries,
			executiveSummary,
		};

		this.lastReport = report;
		return report;
	}

	/**
	 * Main execution entry point. Returns the synthesized Markdown string report.
	 * Preserves 100% backward compatibility with all existing callers and test suites.
	 */
	public async run(
		topic: string,
		onProgress?: StatusCallback,
	): Promise<string> {
		const report = await this.runDetailed(topic, onProgress);
		return report.markdown;
	}
}
