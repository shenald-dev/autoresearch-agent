import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import chalk from "chalk";
import { ResearchData } from "./ResearchAgent";

export interface SummaryData {
    topic: string;
    summary: string;
    wordCount: number;
    sourceCount: number;
    generatedAt: string;
}

/**
 * SummarizerAgent — uses LLM to synthesize research sources into a coherent summary.
 */
export class SummarizerAgent {
    private llm: ChatOpenAI;

    constructor(llm: ChatOpenAI) {
        this.llm = llm;
    }

    async execute(research: ResearchData): Promise<SummaryData> {
        console.log(chalk.gray(`  📝 Summarizing ${research.totalSources} sources...`));

        const sourcesText = research.sources
            .map((s, i) => `[Source ${i + 1}] ${s.title}\n${s.content}`)
            .join("\n\n---\n\n");

        const prompt = PromptTemplate.fromTemplate(`
You are an expert research analyst. You have been given multiple sources about a topic.
Synthesize all the information into a comprehensive, well-structured summary.

Topic: {topic}

Sources:
{sources}

Write a detailed summary (300-500 words) that:
1. Captures the key points from all sources
2. Identifies common themes and findings
3. Notes any conflicting information
4. Maintains an objective, academic tone

Summary:
        `);

        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

        const summary = await chain.invoke({
            topic: research.topic,
            sources: sourcesText,
        });

        return {
            topic: research.topic,
            summary,
            wordCount: summary.split(/\s+/).length,
            sourceCount: research.totalSources,
            generatedAt: new Date().toISOString(),
        };
    }
}
