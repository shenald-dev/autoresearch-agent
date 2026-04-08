<<<<<<< HEAD
#!/usr/bin/env node
import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { ResearchEngine } from "./core/engine";

const program = new Command();

program
    .name("autoresearch")
    .description("✨ Enterprise AI Autonomous Research Agent")
    .version("2.0.0");

program
    .requiredOption("-t, --topic <string>", "The topic to research")
    .option("-d, --depth <number>", "Research depth — max sources to analyze (1-10)", "5")
    .option("-m, --model <string>", "LLM model override (e.g. gpt-4, arcee-ai/trinity-large-preview:free)")
    .option("--dry-run", "Validate config and search without calling LLM (saves API credits)")
    .option("--no-publish", "Skip file output, print results to stdout only")
    .action(async (options) => {
        console.log(chalk.cyanBright("\n✨ AutoResearch Agent v2.0"));
        console.log(chalk.gray("━".repeat(40)));

        const spinner = ora({
            text: `Researching: ${chalk.bold(options.topic)}`,
            color: "cyan",
        }).start();

        try {
            const engine = new ResearchEngine({
                depth: parseInt(options.depth, 10),
                model: options.model,
                dryRun: options.dryRun || false,
            });

            spinner.text = "Running agent pipeline...";
            const result = await engine.run(options.topic);

            spinner.succeed(chalk.green("Research pipeline complete."));
            console.log(result);
        } catch (error: any) {
            spinner.fail(chalk.red("Research pipeline failed."));
            console.error(chalk.red(`\n  Error: ${error.message}`));

            if (error.message.includes("API key")) {
                console.log(chalk.yellow("\n  💡 Tip: Set OPENROUTER_API_KEY or OPENAI_API_KEY in your .env file"));
                console.log(chalk.gray("     Get a free key at https://openrouter.ai"));
            }

            process.exit(1);
        }
    });
=======
import * as p from "@clack/prompts";
import { Command } from "commander";
import pc from "picocolors";
import { z } from "zod";

const program = new Command();

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
		await configManager.setConfig({
			OPENAI_API_KEY: openAiKey as string,
			SERPER_API_KEY: serperKey as string,
		});
		s.stop(pc.green("API keys saved securely to ~/.autoresearch/config.json"));

		p.outro(pc.cyan("You're ready to research!"));
	});

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
					{ value: 2, label: "2 - Basic Research" },
					{ value: 3, label: "3 - Standard Analysis" },
					{ value: 4, label: "4 - Deep Dive" },
					{ value: 5, label: "5 - Exhaustive Study" },
				],
				initialValue: 3,
			});
			if (p.isCancel(depthSelection)) {
				p.cancel("Operation cancelled.");
				process.exit(0);
			}
			depth = depthSelection as number;
		}

		const parseResult = ResearchInputSchema.safeParse({ topic, depth });
		if (!parseResult.success) {
			p.log.error(
				pc.red(
					`Validation Error: ${parseResult.error.errors.map((e) => e.message).join(", ")}`,
				),
			);
			process.exit(1);
		}
		const validatedInput = parseResult.data;

		p.log.step(
			pc.cyan(`Initializing agents for: ${pc.bold(validatedInput.topic)}`),
		);

		const s = p.spinner();
		s.start(`Researching depth level ${validatedInput.depth}...`);

		try {
			const { ResearchEngine } = await import("./core/engine");
			const engine = new ResearchEngine({ depth: validatedInput.depth });
			const result = await engine.run(validatedInput.topic);

			s.stop(pc.green("Research complete."));

			p.log.message(pc.white(result));
			p.outro(pc.cyan("Research report generated successfully!"));
		} catch (error: unknown) {
			s.stop(pc.red("Research failed."));
			p.log.error(
				pc.red(error instanceof Error ? error.message : String(error)),
			);
			process.exit(1);
		}
	});
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))

program.parse();
