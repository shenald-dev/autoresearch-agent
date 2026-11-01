import type { ChatOpenAI } from "@langchain/openai";

function heuristicDecompose(topic: string, count: number): string[] {
	const angles = [
		topic,
		`${topic} technical architecture implementation`,
		`${topic} benchmarks challenges trade-offs`,
		`${topic} real world production case studies`,
		`${topic} comparison state of the art future outlook`,
	];

	return angles.slice(0, count);
}

/**
 * Decomposes a research topic into targeted investigative search queries.
 * Scales query count based on depth (1 to 5).
 */
async function decomposeQuery(
	topic: string,
	depth = 3,
	llm?: ChatOpenAI,
): Promise<string[]> {
	const cleanTopic = topic.trim();
	if (!cleanTopic) return [];

	const queryCount = Math.min(5, Math.max(1, depth));

	// If depth is 1, return the primary query directly
	if (queryCount === 1) {
		return [cleanTopic];
	}

	// Try LLM-based intelligent decomposition if LLM is provided
	if (llm) {
		try {
			const response = await llm.invoke(
				`You are a principal research strategist. Decompose the following research topic into exactly ${queryCount} distinct, highly specific search engine queries to gather a comprehensive 360-degree view.
Topic: "${cleanTopic}"

Guidelines:
- Query 1 should focus on foundational overview and core definitions.
- Query 2 should focus on modern architecture, state-of-the-art implementations, or current standards.
- Query 3 should focus on benchmarks, practical challenges, security, or trade-offs.
- Return ONLY the queries separated by newlines, with no bullet points, numbering, or quotes.`,
			);

			const content = String(response.content || "");
			const lines = content
				.split("\n")
				.map((line) => line.replace(/^[\d.*•\s-]+/, "").trim())
				.filter(Boolean);

			if (lines.length >= 2) {
				return Array.from(new Set([cleanTopic, ...lines])).slice(0, queryCount);
			}
		} catch {
			// Fallback to deterministic heuristic decomposition if LLM fails
		}
	}

	// Deterministic heuristic query generation
	return heuristicDecompose(cleanTopic, queryCount);
}

export const QueryDecomposer = {
	decompose: decomposeQuery,
};
