import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import type { ReportData } from "../exporters/types";

export interface HistoryEntry {
	id: string;
	slug: string;
	topic: string;
	depth: number;
	model: string;
	createdAt: string;
	sourcesCount: number;
	subQueriesCount: number;
	outputDir?: string;
	files: {
		markdown?: string;
		html?: string;
		json?: string;
	};
}

export class HistoryManager {
	private readonly historyPath: string;
	private readonly historyDir: string;

	constructor(customPathOrDir?: string) {
		if (customPathOrDir) {
			if (customPathOrDir.endsWith(".json")) {
				this.historyPath = path.resolve(customPathOrDir);
				this.historyDir = path.dirname(this.historyPath);
			} else {
				this.historyDir = path.resolve(customPathOrDir);
				this.historyPath = path.join(this.historyDir, "history.json");
			}
		} else {
			this.historyDir = path.join(os.homedir(), ".autoresearch");
			this.historyPath = path.join(this.historyDir, "history.json");
		}
	}

	private async readAll(): Promise<HistoryEntry[]> {
		try {
			const data = await fs.readFile(this.historyPath, "utf-8");
			const parsed = JSON.parse(data);
			return Array.isArray(parsed) ? parsed : [];
		} catch {
			return [];
		}
	}

	private async writeAll(entries: HistoryEntry[]): Promise<void> {
		await fs.mkdir(this.historyDir, { recursive: true });
		await fs.writeFile(this.historyPath, JSON.stringify(entries, null, 2), {
			encoding: "utf-8",
			mode: 0o600,
		});
	}

	public async saveRun(
		entryOrReport: HistoryEntry | ReportData,
		files: { markdown?: string; html?: string; json?: string } = {},
	): Promise<HistoryEntry> {
		const entry: HistoryEntry =
			"metadata" in entryOrReport
				? {
						id: entryOrReport.metadata.id,
						slug: entryOrReport.metadata.slug,
						topic: entryOrReport.metadata.topic,
						depth: entryOrReport.metadata.depth,
						model: entryOrReport.metadata.model,
						createdAt: entryOrReport.metadata.createdAt,
						sourcesCount: entryOrReport.metadata.sourcesCount,
						subQueriesCount: entryOrReport.subQueries?.length || 0,
						files: files || {},
					}
				: {
						...entryOrReport,
						files: { ...(entryOrReport.files || {}), ...(files || {}) },
					};

		const entries = await this.readAll();
		// Prepend so latest runs are at index 0
		const updated = [
			entry,
			...entries.filter((e) => e.id !== entry.id && e.slug !== entry.slug),
		];
		// Keep up to 100 recent entries
		await this.writeAll(updated.slice(0, 100));
		return entry;
	}

	public async listRuns(limit = 20): Promise<HistoryEntry[]> {
		const entries = await this.readAll();
		return entries.slice(0, limit);
	}

	public async getRun(idOrSlug: string): Promise<HistoryEntry | null> {
		const entries = await this.readAll();
		const query = idOrSlug.toLowerCase();
		const match = entries.find(
			(e) =>
				(e.id || "").toLowerCase() === query ||
				(e.slug || "").toLowerCase() === query,
		);
		return match || null;
	}

	public async deleteRun(idOrSlug: string): Promise<boolean> {
		const entries = await this.readAll();
		const initialLength = entries.length;
		const query = idOrSlug.toLowerCase();
		const filtered = entries.filter(
			(e) =>
				(e.id || "").toLowerCase() !== query &&
				(e.slug || "").toLowerCase() !== query,
		);
		if (filtered.length !== initialLength) {
			await this.writeAll(filtered);
			return true;
		}
		return false;
	}

	public async clearAll(): Promise<void> {
		await this.writeAll([]);
	}

	public async clear(): Promise<void> {
		await this.clearAll();
	}
}
