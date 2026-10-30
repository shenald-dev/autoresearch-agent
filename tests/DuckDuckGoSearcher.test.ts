import { beforeEach, describe, expect, it, vi } from "vitest";
import { DuckDuckGoSearcher } from "../src/tools/DuckDuckGoSearcher";

// Mock global fetch
global.fetch = vi.fn() as any;

describe("DuckDuckGoSearcher", () => {
	let searcher: DuckDuckGoSearcher;

	beforeEach(() => {
		searcher = new DuckDuckGoSearcher();
		vi.clearAllMocks();
	});

	it("should return empty array for empty or whitespace query", async () => {
		const res1 = await searcher.search("");
		const res2 = await searcher.search("   ");
		expect(res1).toEqual([]);
		expect(res2).toEqual([]);
		expect(global.fetch).not.toHaveBeenCalled();
	});

	it("should parse HTML results, unwrap uddg links, and decode HTML entities", async () => {
		const sampleHtml = `
		<html>
		<body>
			<div class="result results_links">
				<a class="result__a" href="//duckduckgo.com/l/?uddg=https%3A%2F%2Fexample.com%2Fpost%3Fid%3D123%26topic%3Dai&rut=1"><b>Example</b> &amp; Insights</a>
				<a class="result__snippet">This is an &quot;innovative&quot; article &#39;about&#39; LLMs &amp; AI agents.</a>
			</div>
			<div class="result results_links">
				<a class="result__a" href="https://direct-link.org">Direct &lt;Link&gt;</a>
				<a class="result__snippet">Detailed exploration of multi-vector search.</a>
			</div>
		</body>
		</html>
		`;

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			text: async () => sampleHtml,
		});

		const results = await searcher.search("test query", 5);
		expect(results.length).toBe(2);

		expect(results[0].title).toBe("Example & Insights");
		expect(results[0].link).toBe("https://example.com/post?id=123&topic=ai");
		expect(results[0].snippet).toBe(
			'This is an "innovative" article \'about\' LLMs & AI agents.',
		);

		expect(results[1].title).toBe("Direct <Link>");
		expect(results[1].link).toBe("https://direct-link.org/");
		expect(results[1].snippet).toBe(
			"Detailed exploration of multi-vector search.",
		);
	});

	it("should cache identical search requests in memory", async () => {
		const sampleHtml = `
		<div class="result">
			<a class="result__a" href="https://cached.org">Cached Title</a>
			<a class="result__snippet">Cached Snippet</a>
		</div>
		`;

		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			text: async () => sampleHtml,
		});

		const firstCall = await searcher.search("cached query", 2);
		const secondCall = await searcher.search("cached query", 2);

		expect(firstCall).toEqual(secondCall);
		expect(global.fetch).toHaveBeenCalledTimes(1);
	});

	it("should handle empty or malformed HTML safely without throwing", async () => {
		(global.fetch as any).mockResolvedValueOnce({
			ok: true,
			text: async () => "<html><body>No matching results</body></html>",
		});

		const results = await searcher.search("obscure impossible query", 5);
		expect(results).toEqual([]);
	});

	it("should catch fetch errors and return empty array gracefully", async () => {
		(global.fetch as any).mockRejectedValue(new Error("Network failure"));

		const results = await searcher.search("error query", 2);
		expect(results).toEqual([]);
	});
});
