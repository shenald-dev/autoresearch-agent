import { beforeEach, describe, expect, it, vi } from "vitest";
import { SearchManager } from "../src/tools/SearchManager";
import { ConfigManager } from "../src/utils/config";

// Mock DuckDuckGoSearcher
vi.mock("../src/tools/DuckDuckGoSearcher", () => {
	return {
		DuckDuckGoSearcher: class {
			search = vi.fn().mockResolvedValue([
				{
					title: "DDG Result",
					link: "https://duckduckgo-source.com/page",
					snippet: "DDG snippet content",
				},
			]);
		},
	};
});

// Mock GoogleSearcher
vi.mock("../src/tools/GoogleSearcher", () => {
	return {
		GoogleSearcher: class {
			search = vi.fn().mockResolvedValue([
				{
					title: "Serper Result",
					link: "https://google-source.com/article",
					snippet: "Serper snippet content",
				},
			]);
		},
	};
});

describe("SearchManager", () => {
	let configManager: ConfigManager;
	let manager: SearchManager;

	beforeEach(() => {
		configManager = new ConfigManager();
		manager = new SearchManager(configManager);
		vi.clearAllMocks();
	});

	it("should prioritize GoogleSearcher when SERPER_API_KEY is configured", async () => {
		configManager.get = vi.fn().mockImplementation(async (key: string) => {
			if (key === "SERPER_API_KEY") return "valid-serper-key";
			return undefined;
		});

		const results = await manager.search("AI agents", 5);
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].title).toBe("Serper Result");
		expect(results[0].link).toBe("https://google-source.com/article");
	});

	it("should fallback to DuckDuckGo when SERPER_API_KEY is missing", async () => {
		configManager.get = vi.fn().mockResolvedValue(undefined);

		const results = await manager.search("Zero config query", 5);
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].title).toBe("DDG Result");
		expect(results[0].link).toBe("https://duckduckgo-source.com/page");
	});

	it("should fallback to DuckDuckGo when GoogleSearcher throws an error", async () => {
		configManager.get = vi.fn().mockImplementation(async (key: string) => {
			if (key === "SERPER_API_KEY") return "valid-serper-key";
			return undefined;
		});

		// Force googleSearcher to reject
		(manager as any).googleSearcher.search.mockRejectedValueOnce(
			new Error("Rate limit 429"),
		);

		const results = await manager.search("Fallback on error", 3);
		expect(results.length).toBeGreaterThan(0);
		expect(results[0].title).toBe("DDG Result");
	});

	it("should return empty array when query is empty", async () => {
		const results = await manager.search("   ");
		expect(results).toEqual([]);
	});

	it("should execute searchMulti and deduplicate results by normalized URL", async () => {
		configManager.get = vi.fn().mockResolvedValue(undefined);

		(manager as any).ddgSearcher.search = vi
			.fn()
			.mockImplementation(async (q: string) => {
				if (q.includes("architecture")) {
					return [
						{
							title: "Architecture Guide",
							link: "https://example.com/guide#part-1",
							snippet: "Part 1 overview",
						},
						{
							title: "Shared Article",
							link: "https://shared.org/research",
							snippet: "Shared overview",
						},
					];
				}
				return [
					{
						title: "Benchmarks",
						link: "https://example.com/benchmarks",
						snippet: "Performance stats",
					},
					{
						title: "Shared Article Dup",
						link: "https://shared.org/research#section2", // same normalized URL
						snippet: "Duplicate source snippet",
					},
				];
			});

		const results = await manager.searchMulti(
			["AI architecture", "AI benchmarks", "AI architecture"], // duplicate query handled
			3,
		);

		expect(results.length).toBe(3);
		const links = results.map((r) => r.link);
		expect(links).toContain("https://example.com/guide#part-1");
		expect(links).toContain("https://shared.org/research");
		expect(links).toContain("https://example.com/benchmarks");
	});

	it("should return empty array for searchMulti when given empty query array", async () => {
		const results = await manager.searchMulti(["  ", ""]);
		expect(results).toEqual([]);
	});
});
