import { describe, expect, it, vi } from "vitest";
import {
	QueryDecomposer,
	decomposeQuery,
	heuristicDecompose,
} from "../src/core/query-decomposer";

describe("QueryDecomposer", () => {
	it("heuristicDecompose generates targeted research vectors", () => {
		const queries = heuristicDecompose("Vector Database Optimization", 3);
		expect(queries.length).toBe(3);
		expect(queries[0]).toBe("Vector Database Optimization");
		expect(queries[1]).toContain("technical architecture implementation");
		expect(queries[2]).toContain("benchmarks challenges trade-offs");
	});

	it("returns empty array when topic is blank", async () => {
		const queries = await decomposeQuery("   ", 3);
		expect(queries).toEqual([]);
	});

	it("returns single primary query when depth is 1", async () => {
		const queries = await decomposeQuery("Quantum Computing", 1);
		expect(queries).toEqual(["Quantum Computing"]);
	});

	it("uses heuristic decomposition when no LLM is provided", async () => {
		const queries = await decomposeQuery("RAG Architectures", 4);
		expect(queries.length).toBe(4);
		expect(queries[0]).toBe("RAG Architectures");
	});

	it("uses LLM to generate targeted sub-queries when LLM is provided", async () => {
		const mockLlm = {
			invoke: vi.fn().mockResolvedValue({
				content: `1. LLM Evaluation Benchmarks\n2. Hallucination Detection Techniques\n3. Enterprise Production Case Studies`,
			}),
		} as any;

		const queries = await decomposeQuery(
			"LLM Evaluation",
			3,
			mockLlm,
		);

		expect(queries.length).toBe(3);
		expect(queries[0]).toBe("LLM Evaluation");
		expect(queries[1]).toBe("LLM Evaluation Benchmarks");
		expect(queries[2]).toBe("Hallucination Detection Techniques");
		expect(mockLlm.invoke).toHaveBeenCalledTimes(1);
	});

	it("gracefully falls back to heuristic decomposition when LLM invocation throws", async () => {
		const mockLlm = {
			invoke: vi.fn().mockRejectedValue(new Error("API rate limited")),
		} as any;

		const queries = await decomposeQuery("Autonomous Agents", 3, mockLlm);
		expect(queries.length).toBe(3);
		expect(queries[0]).toBe("Autonomous Agents");
		expect(queries[1]).toContain("technical architecture implementation");
	});

	it("exposes both named export and QueryDecomposer object", () => {
		expect(typeof QueryDecomposer.decompose).toBe("function");
		expect(typeof QueryDecomposer.heuristicDecompose).toBe("function");
	});
});
