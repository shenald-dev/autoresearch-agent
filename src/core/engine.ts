<<<<<<< HEAD
import { ChatOpenAI } from "@langchain/openai";
import { StringOutputParser } from "@langchain/core/output_parsers";
import * as dotenv from "dotenv";
import chalk from "chalk";

import { ResearchAgent, ResearchData } from "../agents/ResearchAgent";
import { SummarizerAgent, SummaryData } from "../agents/SummarizerAgent";
import { ContentGenerator, ContentData } from "../agents/ContentGenerator";
import { PublisherAgent, PublishResult } from "../agents/PublisherAgent";

dotenv.config();

export interface EngineConfig {
    depth: number;
    model?: string;
    dryRun?: boolean;
}

export interface PipelineResult {
    success: boolean;
    topic: string;
    research?: ResearchData;
    summary?: SummaryData;
    content?: ContentData;
    published?: PublishResult;
    error?: string;
}

/**
 * Orchestrator — coordinates the full research pipeline across all agents.
 *
 * Pipeline: ResearchAgent → SummarizerAgent → ContentGenerator → PublisherAgent
 */
export class ResearchEngine {
    private config: EngineConfig;
    private llm: ChatOpenAI;

    constructor(config: EngineConfig) {
        this.config = config;

        // Support OpenRouter (preferred) or OpenAI fallback
        const openRouterKey = process.env.OPENROUTER_API_KEY;
        const openAIKey = process.env.OPENAI_API_KEY;
        const apiKey = openRouterKey || openAIKey;

        const modelName = config.model
            || process.env.OPENAI_MODEL
            || (openRouterKey ? "arcee-ai/trinity-large-preview:free" : "gpt-4-turbo-preview");

        const baseURL = openRouterKey
            ? "https://openrouter.ai/api/v1"
            : undefined;

        this.llm = new ChatOpenAI({
            modelName,
            temperature: 0.2,
            openAIApiKey: apiKey,
            ...(baseURL && { configuration: { baseURL } }),
        });
    }

    /**
     * Orchestrates the full 4-agent research pipeline.
     */
    public async run(topic: string): Promise<string> {
        const result = await this.executePipeline(topic);

        if (!result.success) {
            throw new Error(result.error || "Pipeline failed");
        }

        return this.formatOutput(result);
    }

    public async executePipeline(topic: string): Promise<PipelineResult> {
        try {
            // ── Stage 1: Research ──
            console.log(chalk.cyan("\n📡 Stage 1: Research Agent"));
            const researchAgent = new ResearchAgent();
            const research = await researchAgent.execute(topic);

            if (this.config.dryRun) {
                return {
                    success: true,
                    topic,
                    research,
                };
            }

            // ── Stage 2: Summarize ──
            console.log(chalk.cyan("\n📝 Stage 2: Summarizer Agent"));
            const summarizerAgent = new SummarizerAgent(this.llm);
            const summary = await summarizerAgent.execute(research);

            // ── Stage 3: Generate Content ──
            console.log(chalk.cyan("\n✍️  Stage 3: Content Generator"));
            const contentGenerator = new ContentGenerator(this.llm);
            const content = await contentGenerator.execute(summary, research);

            // ── Stage 4: Publish ──
            console.log(chalk.cyan("\n💾 Stage 4: Publisher Agent"));
            const publisherAgent = new PublisherAgent();
            const published = await publisherAgent.execute(content, summary, research);

            return {
                success: true,
                topic,
                research,
                summary,
                content,
                published,
            };
        } catch (error: any) {
            return {
                success: false,
                topic,
                error: error.message,
            };
        }
    }

    private formatOutput(result: PipelineResult): string {
        const lines: string[] = [];

        lines.push(chalk.bold.green(`\n✨ Research Complete: ${result.topic}\n`));

        if (result.summary) {
            lines.push(chalk.white(`📊 Summary: ${result.summary.wordCount} words from ${result.summary.sourceCount} sources`));
        }

        if (result.published) {
            lines.push(chalk.white(`\n📁 Output Files:`));
            lines.push(chalk.gray(`   Blog:    ${result.published.files.blog.md}`));
            lines.push(chalk.gray(`   Report:  ${result.published.files.summary.md}`));
            lines.push(chalk.gray(`   Data:    ${result.published.files.blog.json}`));
        }

        if (result.research) {
            lines.push(chalk.gray(`\n🔍 Sources analyzed: ${result.research.totalSources}`));
        }

        return lines.join("\n");
    }
=======
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
		const contextChunks: string[] = [];
		let i = 1;
		for (const [url, content] of fetchResults.entries()) {
			if (!content.startsWith("Error:")) {
				contextChunks.push(
					`[Source ${i} | ${url}]\n${content.substring(0, 1500)}\n\n`,
				);
			}
			i++;
		}
		const context = contextChunks.join("");

		const chain = this.prompt.pipe(llm);
		const result = await chain.invoke({
			topic,
			context,
		});

		return String(result.content);
	}
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))
}
