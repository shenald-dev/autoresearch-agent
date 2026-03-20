import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from "dotenv";

dotenv.config();

export interface EngineConfig {
	depth: number;
}

export class ResearchEngine {
	private llm: ChatOpenAI;
	private config: EngineConfig;
	// biome-ignore lint/suspicious/noExplicitAny: Langchain's Runnable interface is generic, typing it exactly here adds unnecessary bloat.
	private chain: any;

	constructor(config: EngineConfig) {
		this.config = config;

		const apiKey = process.env.OPENAI_API_KEY;
		if (!apiKey) {
			throw new Error(
				"OPENAI_API_KEY environment variable is not set. " +
					"Add it to your .env file or export it before running.",
			);
		}

		this.llm = new ChatOpenAI({
			modelName: process.env.OPENAI_MODEL || "gpt-4-turbo-preview",
			temperature: 0.2,
			openAIApiKey: apiKey,
		});

		const prompt = PromptTemplate.fromTemplate(`
      You are an expert autonomous researcher. 
      Conduct a deep-dive analysis on the following topic to a depth level of {depth}.
      Format the output as a clean, highly structured markdown document.
      
      Topic: {topic}
    `);

		// Optimization: Construct the LangChain LCEL pipeline once during instantiation
		// to avoid redundant string parsing and object allocation on every run().
		this.chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
	}

	/**
	 * Orchestrates the research pipeline.
	 * In a full implementation, this would chain Tools, memory, and specialized agents.
	 */
	public async run(topic: string): Promise<string> {
		// Execute the LCEL chain
		const result = await this.chain.invoke({
			topic,
			depth: this.config.depth.toString(),
		});

		return result;
	}
}
