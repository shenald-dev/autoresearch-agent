import { ChatOpenAI } from "@langchain/openai";
import { PromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import chalk from "chalk";
import { ResearchData } from "./ResearchAgent";
import { SummaryData } from "./SummarizerAgent";

export interface ContentData {
    topic: string;
    content: {
        blog: string;
        tweetThread: string;
        videoScript: string;
    };
}

/**
 * ContentGenerator — creates multiple content formats from research and summary.
 */
export class ContentGenerator {
    private llm: ChatOpenAI;

    constructor(llm: ChatOpenAI) {
        this.llm = llm;
    }

    async execute(summary: SummaryData, research: ResearchData): Promise<ContentData> {
        console.log(chalk.gray(`  ✍️  Generating multi-format content...`));

        const [blog, tweetThread, videoScript] = await Promise.all([
            this.generateBlog(summary, research),
            this.generateTweets(summary),
            this.generateVideoScript(summary),
        ]);

        return {
            topic: summary.topic,
            content: { blog, tweetThread, videoScript },
        };
    }

    private async generateBlog(summary: SummaryData, research: ResearchData): Promise<string> {
        const prompt = PromptTemplate.fromTemplate(`
You are a professional technical writer. Write a well-structured blog article based on the following research.

Topic: {topic}
Summary: {summary}

Sources for reference:
{sources}

Write a comprehensive blog article in Markdown format that:
- Has a compelling title (H1)
- Includes an introduction, 3-4 main sections, and a conclusion
- References sources where appropriate
- Uses code examples or data if relevant
- Is 800-1200 words
- Maintains a professional but engaging tone

Article:
        `);

        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
        return chain.invoke({
            topic: summary.topic,
            summary: summary.summary,
            sources: research.sources.map((s) => `- ${s.title}: ${s.link}`).join("\n"),
        });
    }

    private async generateTweets(summary: SummaryData): Promise<string> {
        const prompt = PromptTemplate.fromTemplate(`
You are a social media expert. Create a Twitter/X thread based on this research summary.

Topic: {topic}
Summary: {summary}

Create a thread of 5-7 tweets that:
- Starts with a hook tweet
- Each tweet is under 280 characters
- Uses relevant hashtags
- Ends with a call to action
- Number each tweet (1/7, 2/7, etc.)

Thread:
        `);

        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
        return chain.invoke({
            topic: summary.topic,
            summary: summary.summary,
        });
    }

    private async generateVideoScript(summary: SummaryData): Promise<string> {
        const prompt = PromptTemplate.fromTemplate(`
You are a video content creator. Write a 60-second narration script based on this research.

Topic: {topic}
Summary: {summary}

Create a video script that:
- Has NARRATOR lines and [SCENE DESCRIPTION] directions
- Is exactly 60 seconds when read aloud (~150 words)
- Opens with an attention-grabbing hook
- Closes with a thought-provoking question

Script:
        `);

        const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());
        return chain.invoke({
            topic: summary.topic,
            summary: summary.summary,
        });
    }
}
