import { Command } from "commander";
import pc from "picocolors";
import * as p from "@clack/prompts";

const program = new Command();

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
			}
		});

		if (p.isCancel(openAiKey)) {
			p.cancel("Operation cancelled.");
			process.exit(0);
		}

		const serperKey = await p.password({
			message: "Enter your Serper API key (for Google Search):",
			validate: (value) => {
				if (!value) return "API key cannot be empty.";
			}
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
					if (!value || typeof value !== "string" || !value.trim()) return "Topic cannot be empty";
				}
			});
			if (p.isCancel(topic)) {
				p.cancel("Operation cancelled.");
				process.exit(0);
			}
		}

		let depth = options.depth ? parseInt(options.depth, 10) : null;
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
				initialValue: 3
			});
			if (p.isCancel(depthSelection)) {
				p.cancel("Operation cancelled.");
				process.exit(0);
			}
			depth = depthSelection as number;
		}

		p.log.step(pc.cyan(`Initializing agents for: ${pc.bold(topic)}`));

		const s = p.spinner();
		s.start(`Researching depth level ${depth}...`);

		try {
			const { ResearchEngine } = await import("./core/engine");
			const engine = new ResearchEngine({ depth });
			const result = await engine.run(topic as string);

			s.stop(pc.green("Research complete."));
			
			p.log.message(pc.white(result));
			p.outro(pc.cyan("Research report generated successfully!"));
		} catch (error: any) {
			s.stop(pc.red("Research failed."));
			p.log.error(pc.red(error.message || String(error)));
			process.exit(1);
		}
	});

program.parse();
