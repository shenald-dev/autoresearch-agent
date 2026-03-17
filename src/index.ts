import chalk from "chalk";
import { Command } from "commander";
import ora from "ora";
import { z } from "zod";

const program = new Command();

program
	.name("autoresearch")
	.description("Enterprise AI Autonomous Research framework")
	.version("1.0.0");

program
	.requiredOption("-t, --topic <string>", "The topic to research")
	.option("-d, --depth <number>", "Research depth (1-5)", "3")
	.action(async (options) => {
		const optionsSchema = z.object({
			topic: z.string().min(1, "Topic must not be empty"),
			depth: z.coerce
				.number()
				.int()
				.min(1, "Depth must be at least 1")
				.max(5, "Depth must be at most 5"),
		});

		const validationResult = optionsSchema.safeParse(options);
		if (!validationResult.success) {
			console.error(chalk.red("Invalid options provided:"));
			for (const issue of validationResult.error.issues) {
				console.error(chalk.red(`  - ${issue.message}`));
			}
			process.exit(1);
		}

		const validOptions = validationResult.data;
		console.log(chalk.cyanBright("✨ Initializing AutoResearch Agent..."));

		const spinner = ora(
			`Researching: ${chalk.bold(validOptions.topic)}`,
		).start();

		try {
			// Optimization:
			// Lazy-load the heavy ResearchEngine module to significantly reduce
			// CLI startup time (e.g. for --help and --version commands).
			const { ResearchEngine } = await import("./core/engine");
			const engine = new ResearchEngine({ depth: validOptions.depth });
			const result = await engine.run(validOptions.topic);

			spinner.succeed("Research complete.");
			console.log(`\n${chalk.green(result)}`);
		} catch (error) {
			spinner.fail("Research failed.");
			console.error(chalk.red(error));
			process.exit(1);
		}
	});

program.parse();
