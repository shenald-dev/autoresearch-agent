# src/index.ts
/**
 * @fileoverview Main entry point for the AutoResearch CLI.
 * Handles command parsing, user prompts, and orchestrates the research engine.
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
	.version("2.0.0");

/**
 * Auth command action.
 * Prompts the user for OpenAI and Serper API keys and saves them securely via ConfigManager.
 */
program
	.command("auth")
	.description("Set your OpenAI and Serper API keys securely.")
	.action(async () => {
		const { ConfigManager } = await import("./utils/config");
		const configManager = new ConfigManager();

		p.intro(pc.bgBlue(pc.white(" AutoResearch Configuration ")));

		const openAiKey = await p.password({
			message: "Enter your OpenAI API key:",
			validate: (value) => {
				if (!value) return "API key cannot be empty.";
			},
		});

		if (p.isCancel(openAiKey)) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		const serperKey = await p.password({
			message: "Enter your Serper API key (for Google Search):",
			validate: (value) => {
				if (!value) return "API key cannot be empty.";
			},
		});

		if (p.isCancel(serperKey)) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		const s = p.spinner();
		s.start("Saving API keys securely...");
		try {
			await configManager.setConfig({
				OPENAI_API_KEY: openAiKey as string,
				SERPER_API_KEY: serperKey as string,
			});
			s.stop(
				pc.green("API keys saved securely to ~/.autoresearch/config.json"),
			);

			p.outro(pc.cyan("You're ready to research!"));
		} catch (error: unknown) {
			s.stop(pc.red("Failed to save API keys."));
			p.log.error(
				pc.red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
	});

/**
 * Research command action.
 * Collects topic and depth via CLI flags or interactive prompts, validates them,
 * and executes the autonomous research engine.
 */
program
	.command("research")
	.description("Run an autonomous deep-dive research on a topic.")
	.option("-t, --topic <string>", "The topic to research")
	.option("-d, --depth <number>", "Research depth (1-5)")
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
			const { ResearchEngine } = await import("./engine");
			const engine = new ResearchEngine();
			
			s.stop(pc.green("Research engine initialized."));
			p.log.info(`Starting research on: "${parseResult.data.topic}" (Depth: ${parseResult.data.depth})`);
			
			await engine.run(parseResult.data);
			
			p.outro(pc.green("Research completed successfully!"));
		} catch (error: unknown) {
			s.stop(pc.red("Research failed."));
			p.log.error(
				pc.red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
	});

program.parse(process.argv);
