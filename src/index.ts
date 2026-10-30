// src/index.ts
/**
 * @fileoverview Main entry point for the AutoResearch CLI.
 * Handles command parsing, user prompts, history, and orchestrates the research engine.
 */
import * as p from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";
import { z } from "zod";

/**
 * Commander program instance for the AutoResearch CLI.
 */
const program = new Command();

/**
 * Zod schema for validating research input parameters.
 * Ensures topic is within length limits and depth is an integer between 1 and 5.
 */
const ResearchInputSchema = z.object({
	topic: z
		.string()
		.trim()
		.min(1, "Topic cannot be empty")
		.max(200, "Topic is too long"),
	depth: z.coerce
		.number()
		.int()
		.min(1, "Depth must be at least 1")
		.max(5, "Depth cannot exceed 5"),
});

program
	.name("autoresearch")
	.description("Enterprise AI Autonomous Research framework")
	.version("1.0.41");

/**
 * Auth command action.
 * Prompts the user for API keys and endpoint settings, saving them securely via ConfigManager.
 */
program
	.command("auth")
	.description("Configure OpenAI, Serper, and custom model endpoints securely.")
	.action(async () => {
		const { ConfigManager } = await import("./utils/config");
		const configManager = new ConfigManager();

		p.intro(pc.bgBlue(pc.white(" AutoResearch Configuration ")));

		const openAiKey = await p.password({
			message: "Enter your OpenAI API key (or local/proxy token):",
			validate: (value) => {
				if (!value) return "API key cannot be empty.";
			},
		});

		if (p.isCancel(openAiKey)) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		const customBaseUrl = await p.text({
			message:
				"Custom Base URL (Optional - for Ollama, vLLM, LMStudio, OpenRouter, DeepSeek):",
			placeholder:
				"e.g., http://localhost:11434/v1 or https://openrouter.ai/api/v1",
		});

		if (p.isCancel(customBaseUrl)) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		const customModel = await p.text({
			message: "LLM Model Name (Optional, defaults to gpt-4-turbo-preview):",
			placeholder: "e.g., gpt-4o, deepseek-chat, mistral-large",
		});

		if (p.isCancel(customModel)) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		const serperKey = await p.password({
			message:
				"Enter Serper API key (Optional - falls back to built-in DuckDuckGo search if left blank):",
		});

		if (p.isCancel(serperKey)) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		const s = p.spinner();
		s.start("Saving configuration securely...");
		try {
			await configManager.setConfig({
				OPENAI_API_KEY: openAiKey as string,
				OPENAI_BASE_URL:
					typeof customBaseUrl === "string" && customBaseUrl.trim()
						? customBaseUrl.trim()
						: undefined,
				OPENAI_MODEL:
					typeof customModel === "string" && customModel.trim()
						? customModel.trim()
						: undefined,
				SERPER_API_KEY:
					typeof serperKey === "string" && serperKey.trim()
						? serperKey.trim()
						: undefined,
			});
			s.stop(
				pc.green("Configuration saved securely to ~/.autoresearch/config.json"),
			);

			p.outro(pc.cyan("You're ready to research!"));
		} catch (error: unknown) {
			s.stop(pc.red("Failed to save configuration."));
			p.log.error(
				pc.red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
	});

/**
 * Research command action.
 * Collects topic and depth via CLI flags or interactive prompts, validates them,
 * executes the research pipeline, and exports structured artifacts.
 */
program
	.command("research")
	.description("Run an autonomous deep-dive research on a topic.")
	.option("-t, --topic <string>", "The topic to research")
	.option("-d, --depth <number>", "Research depth (1-5)")
	.option("-o, --output <dir>", "Directory to export reports", "./reports")
	.option(
		"-f, --format <format>",
		"Output formats to generate: all, markdown, html, json",
		"all",
	)
	.option("--no-save", "Do not write files to disk, output to terminal only")
	.action(async (options) => {
		p.intro(pc.bgBlue(pc.white(" AutoResearch Engine ")));

		// Interactive Prompts if not provided via flags
		let topic = options.topic;
		if (!topic) {
			topic = await p.text({
				message: "What topic would you like to research?",
				placeholder: "e.g., Quantum Computing advancements in 2026",
				validate: (value) => {
					if (!value || typeof value !== "string" || !value.trim())
						return "Topic cannot be empty";
					if (value.length > 200)
						return "Topic is too long (max 200 characters).";
				},
			});
			if (p.isCancel(topic)) {
				p.cancel("Operation cancelled.");
				process.exit(0);
			}
		}

		let depth = options.depth ? Number.parseInt(options.depth, 10) : null;
		if (!depth) {
			const depthSelection = await p.select({
				message: "Select research depth (1=Surface, 5=Deep Analysis):",
				options: [
					{ value: 1, label: "1 - Quick Overview" },
					{ value: 2, label: "2 - Basic Summary" },
					{ value: 3, label: "3 - Standard Analysis" },
					{ value: 4, label: "4 - Comprehensive Review" },
					{ value: 5, label: "5 - Deep Dive" },
				],
			});
			if (p.isCancel(depthSelection)) {
				p.cancel("Operation cancelled.");
				process.exit(0);
			}
			depth = depthSelection as number;
		}

		// Validate inputs against schema
		const parseResult = ResearchInputSchema.safeParse({ topic, depth });
		if (!parseResult.success) {
			p.log.error(pc.red("Invalid input parameters."));
			for (const issue of parseResult.error.issues) {
				p.log.error(pc.red(` - ${issue.path.join(".")}: ${issue.message}`));
			}
			process.exit(1);
		}

		const s = p.spinner();
		s.start("Initializing research engine...");

		try {
			const { ResearchEngine } = await import("./core/engine");
			const engine = new ResearchEngine({ depth: parseResult.data.depth });

			s.stop(pc.green("Research engine initialized."));
			p.log.step(
				pc.cyan(
					`Starting research on: "${pc.bold(parseResult.data.topic)}" (Depth: ${parseResult.data.depth})`,
				),
			);

			s.start("Conducting research...");
			const reportMarkdown = await engine.run(
				parseResult.data.topic,
				(status) => {
					s.message(status);
				},
			);
			s.stop(pc.green("Research completed."));

			// Print the generated report to stdout
			console.log(`\n${reportMarkdown}\n`);

			// Export artifacts and record in history if save is enabled
			if (options.save !== false) {
				const reportData =
					typeof engine.getLastReport === "function"
						? engine.getLastReport()
						: null;

				if (reportData && reportData.sources.length > 0) {
					const { exportReport } = await import("./exporters");
					const { HistoryManager } = await import("./storage/history");

					const rawFormat = (options.format || "all").toLowerCase();
					let exportFormats: ("markdown" | "html" | "json")[] = [
						"markdown",
						"html",
						"json",
					];
					if (rawFormat === "markdown" || rawFormat === "md") {
						exportFormats = ["markdown"];
					} else if (rawFormat === "html") {
						exportFormats = ["html"];
					} else if (rawFormat === "json") {
						exportFormats = ["json"];
					}

					const outputDir = options.output || "./reports";
					const exportedFiles = await exportReport(
						reportData,
						outputDir,
						exportFormats,
					);

					p.log.message(pc.bold(pc.cyan("📁 Generated Artifacts:")));
					const fileMap: { markdown?: string; html?: string; json?: string } =
						{};
					for (const file of exportedFiles) {
						fileMap[file.format] = file.filePath;
						p.log.message(
							`  ${pc.green("✓")} ${pc.white(file.filename)}: ${pc.gray(file.filePath)}`,
						);
					}

					// Save run to local history library
					const historyManager = new HistoryManager();
					await historyManager.saveRun({
						id: reportData.metadata.id,
						slug: reportData.metadata.slug,
						topic: reportData.metadata.topic,
						depth: reportData.metadata.depth,
						model: reportData.metadata.model,
						createdAt: reportData.metadata.createdAt,
						sourcesCount: reportData.metadata.sourcesCount,
						subQueriesCount: reportData.subQueries.length,
						outputDir,
						files: fileMap,
					});
				}
			}

			p.outro(pc.green("Research completed successfully!"));
		} catch (error: unknown) {
			s.stop(pc.red("Research failed."));
			p.log.error(
				pc.red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
	});

/**
 * List command action.
 * Displays past research reports stored in ~/.autoresearch/history.json.
 */
program
	.command("list")
	.description("List past research runs stored in your local research library.")
	.option("-n, --limit <number>", "Number of records to display", "15")
	.action(async (options) => {
		const { HistoryManager } = await import("./storage/history");
		const history = new HistoryManager();
		const limit = Number.parseInt(options.limit, 10) || 15;
		const runs = await history.listRuns(limit);

		if (runs.length === 0) {
			console.log(pc.yellow("No past research runs found in history."));
			console.log(
				pc.gray(
					"Run `autoresearch research` to start your first research session.",
				),
			);
			return;
		}

		console.log(
			pc.bold(pc.cyan(`\n📚 Research History (${runs.length} runs):\n`)),
		);
		console.log(
			pc.bold(
				`${"ID".padEnd(16)} ${"DATE".padEnd(20)} ${"DEPTH".padEnd(7)} ${"SOURCES".padEnd(9)} TOPIC`,
			),
		);
		console.log(pc.gray("-".repeat(80)));

		for (const r of runs) {
			const idStr = r.id.padEnd(16);
			const dateStr = new Date(r.createdAt).toLocaleDateString().padEnd(20);
			const depthStr = String(r.depth).padEnd(7);
			const srcStr = String(r.sourcesCount).padEnd(9);
			const topicStr =
				r.topic.length > 40 ? `${r.topic.slice(0, 37)}...` : r.topic;

			console.log(
				`${pc.cyan(idStr)} ${dateStr} ${depthStr} ${srcStr} ${pc.white(topicStr)}`,
			);
		}
		console.log();
	});

/**
 * View command action.
 * Views or opens a past research report by ID or slug.
 */
program
	.command("view <idOrSlug>")
	.description("View or open a past research report.")
	.option("--open", "Open the HTML report in default web browser")
	.action(async (idOrSlug, options) => {
		const { HistoryManager } = await import("./storage/history");
		const history = new HistoryManager();
		const entry = await history.getRun(idOrSlug);

		if (!entry) {
			console.error(
				pc.red(`Error: No research run found matching "${idOrSlug}".`),
			);
			console.log(
				pc.gray("Run `autoresearch list` to see available research IDs."),
			);
			process.exit(1);
		}

		if (options.open && entry.files.html) {
			const { exec } = await import("node:child_process");
			const cmd =
				process.platform === "win32"
					? `start "" "${entry.files.html}"`
					: process.platform === "darwin"
						? `open "${entry.files.html}"`
						: `xdg-open "${entry.files.html}"`;
			exec(cmd);
			console.log(pc.green(`Opened ${entry.files.html} in browser.`));
			return;
		}

		// Read and print markdown report
		if (entry.files.markdown) {
			const fs = await import("node:fs/promises");
			try {
				const md = await fs.readFile(entry.files.markdown, "utf-8");
				console.log(`\n${md}\n`);
				return;
			} catch {}
		}

		console.log(pc.bold(pc.cyan(`\nResearch Run: ${entry.topic}`)));
		console.log(`ID: ${entry.id}`);
		console.log(`Created: ${new Date(entry.createdAt).toLocaleString()}`);
		console.log(`Depth: ${entry.depth} | Sources: ${entry.sourcesCount}`);
		if (entry.files.html) console.log(`HTML Report: ${entry.files.html}`);
		if (entry.files.markdown)
			console.log(`Markdown Report: ${entry.files.markdown}`);
	});

export const cliPromise = program.parseAsync();
