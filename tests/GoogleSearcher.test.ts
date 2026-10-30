import { describe, it, expect, beforeEach, vi } from "vitest";
import { GoogleSearcher } from "../src/tools/GoogleSearcher";
import { ConfigManager } from "../src/utils/config";

// Mock ConfigManager mapping
vi.mock("../src/utils/config", () => {
	return {
		ConfigManager: class {
			get = vi.fn().mockResolvedValue("test-serper-key");
		},
	};
});

// Mock global fetch
global.fetch = vi.fn() as any;

describe("GoogleSearcher", () => {
	let searcher: GoogleSearcher;

	beforeEach(() => {
		searcher = new GoogleSearcher();
		vi.clearAllMocks();
	});

	it("should use injected configManager", async () => {
		const customConfigManager = new ConfigManager();
		customConfigManager.get = vi.fn().mockResolvedValue("custom-key");
		const customSearcher = new GoogleSearcher(customConfigManager);
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => ({ organic: [] }),
		});
		await customSearcher.search("test");
		expect(customConfigManager.get).toHaveBeenCalledWith("SERPER_API_KEY");
	});

	it("should return search results on successful API call", async () => {
		const mockResponse = {
			organic: [
				{ title: "Result 1", link: "https://r1.com", snippet: "Snippet 1" },
				{ title: "Result 2", link: "https://r2.com", snippet: "Snippet 2" },
			],
		};

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		const results = await searcher.search("test query", 2);

		expect(results).toHaveLength(2);
		expect(results[0].title).toBe("Result 1");
	});

	it("should retry with exponential backoff on failure", async () => {
		// Mock setTimeout to fire immediately for tests
		vi.spyOn(global, "setTimeout").mockImplementation((cb: any) => {
			cb();
			return 0 as any;
		});

		// Fail twice, succeed on the third time
		(global.fetch as any)
			.mockRejectedValueOnce(new Error("Network Error 1"))
			.mockRejectedValueOnce(new Error("Network Error 2"))
			.mockResolvedValueOnce({
				ok: true,
				json: async () => ({
					organic: [{ title: "Success", link: "s", snippet: "s" }],
				}),
			});

		const results = await searcher.search("retry test", 1);

		expect(results).toHaveLength(1);
		expect(results[0].title).toBe("Success");
		expect(global.fetch).toHaveBeenCalledTimes(3);

		vi.restoreAllMocks();
	});

	it("should throw error if max retries exceeded", async () => {
		vi.spyOn(global, "setTimeout").mockImplementation((cb: any) => {
			cb();
			return 0 as any;
		});

		// Always fail
		(global.fetch as any).mockRejectedValue(
			new Error("Persistent Network Error"),
		);

		await expect(searcher.search("fail test", 1)).rejects.toThrow(
			"Persistent Network Error",
		);

		// Should have tried 3 times (the maxRetries default)
		expect(global.fetch).toHaveBeenCalledTimes(3);

		vi.restoreAllMocks();
	});

	it("should fail fast without retrying on 4xx client errors (except 429)", async () => {
		vi.spyOn(global, "setTimeout").mockImplementation((cb: any) => {
			cb();
			return 0 as any;
		});

		(global.fetch as any).mockResolvedValue({
			ok: false,
			status: 403,
			body: { cancel: vi.fn().mockResolvedValue(undefined) },
		});

		await expect(searcher.search("fail fast test", 1)).rejects.toThrow(
			"Serper API HTTP error: 403",
		);

		// Should only try once because it fails fast
		expect(global.fetch).toHaveBeenCalledTimes(1);

		vi.restoreAllMocks();
	});

	it("should return empty array immediately for empty or whitespace query without network call", async () => {
		const resultEmpty = await searcher.search("");
		const resultWhitespace = await searcher.search("   ");

		expect(resultEmpty).toEqual([]);
		expect(resultWhitespace).toEqual([]);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("should filter out results missing valid links and safely handle null or undefined titles and snippets", async () => {
		const mockResponse = {
			organic: [
				{ title: "Valid Title", link: "https://valid.com", snippet: "Valid snippet" },
				{ title: null, link: "https://notitle.com", snippet: undefined },
				{ title: "No Link", link: "", snippet: "Should be filtered" },
				{ title: "Missing Link", snippet: "Should be filtered" },
				null,
			],
		};

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			json: async () => mockResponse,
		});

		const results = await searcher.search("sanitize test", 5);

		expect(results).toHaveLength(2);
		expect(results[0]).toEqual({
			title: "Valid Title",
			link: "https://valid.com",
			snippet: "Valid snippet",
		});
		expect(results[1]).toEqual({
			title: "",
			link: "https://notitle.com",
			snippet: "",
		});
	});
});
