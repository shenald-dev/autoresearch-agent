import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResearchEngine } from "../src/core/engine";

// Mock the dependencies
vi.mock("../src/tools/GoogleSearcher", () => ({
	GoogleSearcher: class {
		search = vi.fn();
	},
}));
vi.mock("../src/tools/WebFetcher", () => ({
	WebFetcher: class {
		fetchBatch = vi.fn();
	},
}));
vi.mock("../src/utils/config", () => ({
	ConfigManager: class {
		get = vi.fn().mockResolvedValue("mock-key"),
	},
}));
vi.mock("@langchain/openai", () => ({
	ChatOpenAI: class {
		invoke = vi.fn(),
	},
}));

describe("ResearchEngine", () => {
	let engine: any;

	beforeEach(() => {
		engine = new ResearchEngine({ depth: 1 });
	});

	it("throws an error if OPENAI_API_KEY is missing", async () => {
		engine.configManager.get.mockResolvedValueOnce(undefined);
		await expect(engine.run("test topic")).rejects.toThrow("OPENAI_API_KEY is missing.");
	});

	it("should handle invalid URL silently during filtering", async () => {
		engine.searcher.search.mockResolvedValueOnce([
			{ link: "invalid-url" },
			{ link: "http://valid.com" },
		]);
		const fetchResults = new Map();
		fetchResults.set("http://valid.com", "Valid content");
        fetchResults.set("invalid-url", "Error: failed");
		engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);
		engine.prompt.pipe = vi.fn().mockReturnValue({
			invoke: vi.fn().mockImplementation(async (args) => {
				return { content: args.context };
			}),
		});

		const result = await engine.run("test topic");
		expect(result).toContain("valid.com");
	});

	it("should return early if no sources are found", async () => {
		engine.searcher.search.mockResolvedValueOnce([]);
		const result = await engine.run("test topic");
		expect(result).toContain("No results found");
	});

	it("should return early if all sources fail to fetch", async () => {
		engine.searcher.search.mockResolvedValueOnce([{ link: "http://test.com" }]);
		const fetchResults = new Map();
		fetchResults.set("http://test.com", "Error: failed");
		engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);

		const result = await engine.run("test topic");
		expect(result).toContain("No valid content could be extracted");
	});

	it("should deduplicate content from different URLs", async () => {
		engine.searcher.search.mockResolvedValueOnce([
			{ link: "http://test1.com" },
			{ link: "http://test2.com" },
		]);

		const fetchResults = new Map();
		fetchResults.set("http://test1.com", "Identical content");
		fetchResults.set("http://test2.com", "Identical content");
		engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);

		// Mock LLM to return the context it was given for assertion
		engine.prompt.pipe = vi.fn().mockReturnValue({
			invoke: vi.fn().mockImplementation(async (args: any) => {
				return { content: args.context };
			}),
		});

		const result = await engine.run("test topic");

		// Should only contain one source in the context due to deduplication
		expect(result).toContain("Source 1");
		expect(result).not.toContain("Source 2");
	});

	it("should skip empty or whitespace-only context chunks", async () => {
		engine.searcher.search.mockResolvedValueOnce([
			{ link: "http://test1.com" },
			{ link: "http://test2.com" },
		]);

		const fetchResults = new Map();
		fetchResults.set("http://test1.com", "   \n  ");
		fetchResults.set("http://test2.com", "Valid content");
		engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);

		engine.prompt.pipe = vi.fn().mockReturnValue({
			invoke: vi.fn().mockImplementation(async (args: any) => {
				return { content: args.context };
			}),
		});

		const result = await engine.run("test topic");

		expect(result).not.toContain("test1.com");
		expect(result).toContain("test2.com");
	});

	it("should gracefully handle empty arrays from searcher", async () => {
		engine.searcher.search.mockResolvedValueOnce([]);
		const result = await engine.run("empty topic");
		expect(result).toContain("No results found");
	});

	it("should safely handle malformed URLs or non-URL entries in search results during deduplication", async () => {
		engine.searcher.search.mockResolvedValueOnce([
			{ link: "not a valid url format" },
			{ link: "http://good-url.com" },
			{ link: "not a valid url format" }, // duplicate malformed
		]);

		const fetchResults = new Map();
		fetchResults.set("not a valid url format", "Error: Invalid URL");
		fetchResults.set("http://good-url.com", "Good Content");
		engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);

		engine.prompt.pipe = vi.fn().mockReturnValue({
			invoke: vi.fn().mockImplementation(async (args: any) => {
				return { content: args.context };
			}),
		});

		const result = await engine.run("malformed test topic");

		// Should still process the good URL and not fail on the malformed one
		expect(result).toContain("Good Content");
		expect(result).not.toContain("Error: Invalid URL");
		// Verify fetchBatch only received two unique inputs
		expect(engine.fetcher.fetchBatch).toHaveBeenCalledWith(["not a valid url format", "http://good-url.com"]);
	});

	it("should preserve original order when deduplicating URLs", async () => {
		engine.searcher.search.mockResolvedValueOnce([
			{ link: "http://first.com" },
			{ link: "http://second.com" },
			{ link: "http://first.com" }, // duplicate
			{ link: "http://third.com" },
		]);

		const fetchResults = new Map();
		fetchResults.set("http://first.com", "Content 1");
		fetchResults.set("http://second.com", "Content 2");
		fetchResults.set("http://third.com", "Content 3");
		engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);

		engine.prompt.pipe = vi.fn().mockReturnValue({
			invoke: vi.fn().mockImplementation(async (args: any) => {
				return { content: args.context };
			}),
		});

		await engine.run("test topic");

		// Map iteration in fetchBatch mock shouldn't matter here, what matters is the input array order to fetchBatch
		expect(engine.fetcher.fetchBatch).toHaveBeenCalledWith([
			"http://first.com",
			"http://second.com",
			"http://third.com"
		]);
	});

	it("should preemptively deduplicate search URLs before fetching", async () => {
		engine.searcher.search.mockResolvedValueOnce([
			{ link: "http://test.com/page#section1" },
			{ link: "http://test.com/page#section2" },
			{ link: "http://test.com/other" }
		]);

		const fetchResults = new Map();
		fetchResults.set("http://test.com/page", "Content 1");
		fetchResults.set("http://test.com/other", "Content 2");
		engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);

		engine.prompt.pipe = vi.fn().mockReturnValue({
			invoke: vi.fn().mockImplementation(async (args: any) => {
				return { content: args.context };
			}),
		});

		await engine.run("test topic");

		expect(engine.fetcher.fetchBatch).toHaveBeenCalledWith([
			"http://test.com/page#section1",
			"http://test.com/other"
		]);
	});
});
