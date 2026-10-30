import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { exportReport } from "../src/exporters";
import { generateHtmlReport } from "../src/exporters/html";
import { generateJsonReport } from "../src/exporters/json";
import { generateMarkdownReport } from "../src/exporters/markdown";
import type { ReportData } from "../src/exporters/types";

describe("Exporters", () => {
	let sampleReport: ReportData;
	let tempDir: string;

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "autoresearch-export-test-"));
		sampleReport = {
			metadata: {
				id: "rep_test_123",
				slug: "agent-architecture-test",
				topic: "Agent Architecture",
				depth: 3,
				model: "gpt-4o",
				createdAt: "2026-03-31T12:00:00.000Z",
				sourcesCount: 2,
			},
			markdown: "# Agent Architecture\n\nComprehensive findings on multi-agent systems.",
			executiveSummary: "Multi-agent systems improve reliability through specialized delegation.",
			sources: [
				{
					index: 1,
					title: "Building Multi-Agent Systems",
					url: "https://example.com/multi-agent",
					snippet: "An architectural guide to agent coordination.",
				},
				{
					index: 2,
					title: "Benchmarks in Autonomy",
					url: "https://example.com/benchmarks",
					snippet: "Measuring latency and accuracy in agents.",
				},
			],
			subQueries: ["Agent Architecture", "multi-agent benchmarks"],
		};
	});

	afterEach(async () => {
		try {
			await fs.rm(tempDir, { recursive: true, force: true });
		} catch {}
	});

	it("generateMarkdownReport produces valid YAML frontmatter and cited references", () => {
		const md = generateMarkdownReport(sampleReport);
		expect(md).toContain("---");
		expect(md).toContain("Agent Architecture");
		expect(md).toContain("depth: 3");
		expect(md).toContain("model: gpt-4o");
		expect(md).toContain("## 📚 Sources & Bibliography");
		expect(md).toContain("Building Multi-Agent Systems");
		expect(md).toContain("https://example.com/multi-agent");
		expect(md).toContain("Benchmarks in Autonomy");
	});

	it("generateHtmlReport creates a standalone responsive HTML document with CSS", () => {
		const html = generateHtmlReport(sampleReport);
		expect(html).toContain("<!DOCTYPE html>");
		expect(html).toContain("<title>Agent Architecture - AutoResearch Report</title>");
		expect(html).toContain("@media (prefers-color-scheme: light)");
		expect(html).toContain("@media print");
		expect(html).toContain("Building Multi-Agent Systems");
		expect(html).toContain("https://example.com/multi-agent");
		expect(html).toContain("rep_test_123");
	});

	it("generateJsonReport outputs valid structured JSON", () => {
		const jsonStr = generateJsonReport(sampleReport);
		const parsed = JSON.parse(jsonStr);
		expect(parsed.metadata.id).toBe("rep_test_123");
		expect(parsed.sources.length).toBe(2);
		expect(parsed.sources[0].url).toBe("https://example.com/multi-agent");
		expect(parsed.subQueries).toEqual(["Agent Architecture", "multi-agent benchmarks"]);
	});

	it("exportReport writes files to output directory for specified formats", async () => {
		const results = await exportReport(sampleReport, {
			outputDir: tempDir,
			formats: ["markdown", "html", "json"],
		});

		expect(results.length).toBe(3);

		const mdResult = results.find((r) => r.format === "markdown");
		const htmlResult = results.find((r) => r.format === "html");
		const jsonResult = results.find((r) => r.format === "json");

		expect(mdResult).toBeDefined();
		expect(htmlResult).toBeDefined();
		expect(jsonResult).toBeDefined();

		const mdExists = await fs.stat(mdResult!.filePath).then(() => true).catch(() => false);
		const htmlExists = await fs.stat(htmlResult!.filePath).then(() => true).catch(() => false);
		const jsonExists = await fs.stat(jsonResult!.filePath).then(() => true).catch(() => false);

		expect(mdExists).toBe(true);
		expect(htmlExists).toBe(true);
		expect(jsonExists).toBe(true);
	});
});
