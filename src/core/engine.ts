import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import { GoogleSearcher } from "../tools/GoogleSearcher";
import { WebFetcher } from "../tools/WebFetcher";
import { ConfigManager } from "../utils/config";

export interface EngineConfig {
	depth: number;
}

export type StatusCallback = (message: string) => void;

export class ResearchEngine {
	private config: EngineConfig;
	private configManager: ConfigManager;
	private searcher: GoogleSearcher;
	private fetcher: WebFetcher;
	private prompt: PromptTemplate;

	constructor(config: EngineConfig) {
		this.config = config;
		this.configManager = new ConfigManager();
		this.searcher = new GoogleSearcher();
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

	private async initLLM(): Promise<ChatOpenAI> {
		const apiKey = await this.configManager.get("OPENAI_API_KEY");
		if (!apiKey) {
			throw new Error(
				"OPENAI_API_KEY is missing. Please run 'autoresearch auth' to configure it.",
			);
		}

		return new ChatOpenAI({
			modelName:
				(await this.configManager.get("OPENAI_MODEL")) || "gpt-4-turbo-preview",
			temperature: 0.2,
			apiKey: apiKey,
		});
	}

	public async run(
		topic: string,
		onProgress?: StatusCallback,
	): Promise<string> {
		const updateStatus = (msg: string) => {
			if (onProgress) onProgress(msg);
		};

		const llm = await this.initLLM();

		// Phase 1: Search
		updateStatus(`🔍 Searching Google for: "${topic}"...`);
		const searchResults = await this.searcher.search(
			topic,
			this.config.depth * 2,
		);

		if (searchResults.length === 0) {
			return `No results found for "${topic}". The API key may be missing or the query was too niche.`;
		}

		// Phase 2: Fetch and Extract
		updateStatus(
			`📄 Discovered ${searchResults.length} sources. Fetching content concurrently...`,
		);
		const urls = searchResults.map((r) => r.link);
		const fetchResults = await this.fetcher.fetchBatch(urls);

		// Phase 3: Synthesize
		updateStatus(
			`🧠 Synthesizing ${fetchResults.size} sources into a final report...`,
		);

		// Build context from results
		let context = "";
		let i = 1;
		for (const [url, content] of fetchResults.entries()) {
			if (!content.startsWith("Error:")) {
				context += `[Source ${i} | ${url}]\n${content.substring(0, 1500)}\n\n`;
			}
			i++;
		}

		const chain = this.prompt.pipe(llm);
		const result = await chain.invoke({
			topic,
			context,
		});

		return String(result.content);
	}
}
