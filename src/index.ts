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

program.parse();
