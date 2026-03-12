import { ResearchEngine } from "../src/core/engine";
import { WebSearch } from "../src/tools/WebSearch";

describe("WebSearch (standalone)", () => {
    it("should return mock results when no API key is set", async () => {
        delete process.env.SERPAPI_KEY;
        const search = new WebSearch();
        const results = await search.search("artificial intelligence");
        expect(results.length).toBeGreaterThan(0);
        expect(results[0]).toHaveProperty("title");
        expect(results[0]).toHaveProperty("link");
        expect(results[0]).toHaveProperty("snippet");
    });
});

describe("ResearchEngine", () => {
    beforeEach(() => {
        // Provide a dummy key so ChatOpenAI constructor doesn't throw
        process.env.OPENROUTER_API_KEY = "test-dummy-key";
    });

    afterEach(() => {
        delete process.env.OPENROUTER_API_KEY;
    });

    it("should instantiate with default config", () => {
        const engine = new ResearchEngine({ depth: 3 });
        expect(engine).toBeDefined();
    });

    it("should support dry-run mode without LLM calls", async () => {
        delete process.env.SERPAPI_KEY;
        const engine = new ResearchEngine({ depth: 3, dryRun: true });
        const result = await engine.executePipeline("test topic");

        expect(result.success).toBe(true);
        expect(result.topic).toBe("test topic");
        expect(result.research).toBeDefined();
        expect(result.research!.sources.length).toBeGreaterThan(0);
        // Dry run should NOT call LLM stages
        expect(result.summary).toBeUndefined();
        expect(result.content).toBeUndefined();
    }, 20000);

    it("should accept model override", () => {
        const engine = new ResearchEngine({
            depth: 5,
            model: "gpt-4",
        });
        expect(engine).toBeDefined();
    });
});
