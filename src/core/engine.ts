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

	constructor(config: EngineConfig) {
		this.config = config;
		this.llm = new ChatOpenAI({
			modelName: "gpt-4-turbo-preview",
			temperature: 0.2,
		});
	}

	/**
	 * Orchestrates the research pipeline.
	 * In a full implementation, this would chain Tools, memory, and specialized agents.
	 */
	public async run(topic: string): Promise<string> {
		const prompt = PromptTemplate.fromTemplate(`
      You are an expert autonomous researcher. 
      Conduct a deep-dive analysis on the following topic to a depth level of {depth}.
      Format the output as a clean, highly structured markdown document.
      
      Topic: {topic}
    `);

		const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

		// Execute the LCEL chain
		const result = await chain.invoke({
			topic,
			depth: this.config.depth.toString(),
		});

		return result;
	}
}
