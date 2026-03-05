import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { ResearchEngine } from "./core/engine";

const program = new Command();

program
    .name("autoresearch")
    .description("Enterprise AI Autonomous Research framework")
    .version("1.0.0");

program
    .requiredOption("-t, --topic <string>", "The topic to research")
    .option("-d, --depth <number>", "Research depth (1-5)", "3")
    .action(async (options) => {
        console.log(chalk.cyanBright("✨ Initializing AutoResearch Agent..."));

        const spinner = ora(`Researching: ${chalk.bold(options.topic)}`).start();

        try {
            const engine = new ResearchEngine({ depth: parseInt(options.depth, 10) });
            const result = await engine.run(options.topic);

            spinner.succeed("Research complete.");
            console.log("\n" + chalk.green(result));
        } catch (error) {
            spinner.fail("Research failed.");
            console.error(chalk.red(error));
            process.exit(1);
        }
    });

program.parse();
