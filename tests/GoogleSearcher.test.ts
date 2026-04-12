import { beforeEach, describe, expect, it, vi } from "vitest";
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
});
