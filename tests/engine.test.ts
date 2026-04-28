import { describe, it, expect, vi, beforeEach } from "vitest";
import { ResearchEngine } from "../src/core/engine";

// Mock the dependencies
vi.mock("../src/tools/GoogleSearcher", () => ({
    GoogleSearcher: class {
        search = vi.fn();
    }
}));
vi.mock("../src/tools/WebFetcher", () => ({
    WebFetcher: class {
        fetchBatch = vi.fn();
    }
}));
vi.mock("../src/utils/config", () => ({
    ConfigManager: class {
        get = vi.fn().mockResolvedValue("mock-key");
    }
}));
vi.mock("@langchain/openai", () => ({
    ChatOpenAI: class {
        invoke = vi.fn();
    }
}));

describe("ResearchEngine", () => {
    let engine: any;

    beforeEach(() => {
        engine = new ResearchEngine({ depth: 1 });
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
            { link: "http://test2.com" }
        ]);

        const fetchResults = new Map();
        fetchResults.set("http://test1.com", "Identical content");
        fetchResults.set("http://test2.com", "Identical content");
        engine.fetcher.fetchBatch.mockResolvedValueOnce(fetchResults);

        // Mock LLM to return the context it was given for assertion
        engine.prompt.pipe = vi.fn().mockReturnValue({
            invoke: vi.fn().mockImplementation(async (args: any) => {
                return { content: args.context };
            })
        });

        const result = await engine.run("test topic");

        // Should only contain one source in the context due to deduplication
        expect(result).toContain("Source 1");
        expect(result).not.toContain("Source 2");
    });
});