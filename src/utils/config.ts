import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";

export interface AutoResearchConfig {
	OPENAI_API_KEY?: string;
	OPENAI_MODEL?: string;
	SERPER_API_KEY?: string;
}

export class ConfigManager {
	private readonly configDir: string;
	private readonly configPath: string;

	constructor() {
		this.configDir = path.join(os.homedir(), ".autoresearch");
		this.configPath = path.join(this.configDir, "config.json");
	}

	/**
	 * Retrieves the current configuration.
	 */
	async getConfig(): Promise<AutoResearchConfig> {
		try {
			const data = await fs.readFile(this.configPath, "utf-8");
			return JSON.parse(data);
		} catch {
			return {};
		}
	}

	/**
	 * Saves configuration securely with restricted file permissions (600).
	 */
	async setConfig(newConfig: Partial<AutoResearchConfig>): Promise<void> {
		const current = await this.getConfig();
		const merged = { ...current, ...newConfig };

		try {
			await fs.mkdir(this.configDir, { recursive: true });
		} catch {}

		await fs.writeFile(this.configPath, JSON.stringify(merged, null, 2), {
			encoding: "utf-8",
			mode: 0o600, // Secure permissions: read/write for owner only
		});
	}

	/**
	 * Gets a specific API key, falling back to process.env if available (for CI/CD).
	 */
	async get(key: keyof AutoResearchConfig): Promise<string | undefined> {
		if (process.env[key]) {
			return process.env[key];
		}
		const config = await this.getConfig();
		return config[key];
	}
}
