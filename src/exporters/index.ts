import * as fs from "node:fs/promises";
import * as path from "node:path";
import { generateHtmlReport } from "./html";
import { generateJsonReport } from "./json";
import { generateMarkdownReport } from "./markdown";
import type { ExportResult, ReportData } from "./types";

export * from "./types";

export interface ExportReportOptions {
	outputDir?: string;
	formats?: ("markdown" | "html" | "json")[];
}

export async function exportReport(
	data: ReportData,
	baseOutputDirOrOptions: string | ExportReportOptions = "./reports",
	formatsArg: ("markdown" | "html" | "json")[] = ["markdown", "html", "json"],
): Promise<ExportResult[]> {
	let baseOutputDir = "./reports";
	let formats = formatsArg;

	if (typeof baseOutputDirOrOptions === "string") {
		baseOutputDir = baseOutputDirOrOptions;
	} else if (
		typeof baseOutputDirOrOptions === "object" &&
		baseOutputDirOrOptions !== null
	) {
		baseOutputDir = baseOutputDirOrOptions.outputDir || "./reports";
		if (baseOutputDirOrOptions.formats) {
			formats = baseOutputDirOrOptions.formats;
		}
	}

	const reportDir = path.resolve(baseOutputDir, data.metadata.slug);
	await fs.mkdir(reportDir, { recursive: true });

	const results: ExportResult[] = [];

	if (formats.includes("markdown")) {
		const mdContent = generateMarkdownReport(data);
		const mdPath = path.join(reportDir, "report.md");
		await fs.writeFile(mdPath, mdContent, "utf-8");
		results.push({
			format: "markdown",
			filePath: mdPath,
			filename: "report.md",
		});
	}

	if (formats.includes("html")) {
		const htmlContent = generateHtmlReport(data);
		const htmlPath = path.join(reportDir, "report.html");
		await fs.writeFile(htmlPath, htmlContent, "utf-8");
		results.push({
			format: "html",
			filePath: htmlPath,
			filename: "report.html",
		});
	}

	if (formats.includes("json")) {
		const jsonContent = generateJsonReport(data);
		const jsonPath = path.join(reportDir, "report.json");
		await fs.writeFile(jsonPath, jsonContent, "utf-8");
		results.push({
			format: "json",
			filePath: jsonPath,
			filename: "report.json",
		});
	}

	return results;
}
