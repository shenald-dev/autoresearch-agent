import * as fs from "node:fs/promises";
import * as os from "node:os";
import * as path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { ReportData } from "../src/exporters/types";
import { HistoryManager } from "../src/storage/history";

describe("HistoryManager", () => {
	let tempDir: string;
	let customHistoryPath: string;
	let manager: HistoryManager;

	const mockReport: ReportData = {
		metadata: {
			id: "rep_history_test_1",
			slug: "distributed-consensus",
			topic: "Distributed Consensus Protocols",
			depth: 2,
			model: "gpt-4o-mini",
			createdAt: new Date().toISOString(),
			sourcesCount: 3,
		},
		markdown: "# Distributed Consensus\n\nAnalysis of Raft vs Paxos.",
		sources: [
			{
				index: 1,
				title: "Raft Paper",
				url: "https://raft.github.io",
				snippet: "In search of an understandable consensus algorithm",
			},
		],
		subQueries: ["Distributed Consensus Protocols"],
		executiveSummary: "Raft decomposes consensus into leader election and log replication.",
	};

	beforeEach(async () => {
		tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "autoresearch-history-test-"));
		customHistoryPath = path.join(tempDir, "history.json");
		manager = new HistoryManager(customHistoryPath);
	});

	afterEach(async () => {
		try {
			await fs.rm(tempDir, { recursive: true, force: true });
		} catch {}
	});

	it("returns empty list if history file does not exist", async () => {
		const runs = await manager.listRuns();
		expect(runs).toEqual([]);
	});

	it("saves a research run and reads it back", async () => {
		await manager.saveRun(mockReport, {
			markdown: "/tmp/report.md",
			html: "/tmp/report.html",
		});

		const runs = await manager.listRuns();
		expect(runs.length).toBe(1);
		expect(runs[0].id).toBe("rep_history_test_1");
		expect(runs[0].topic).toBe("Distributed Consensus Protocols");
		expect(runs[0].files.markdown).toBe("/tmp/report.md");

		const retrieved = await manager.getRun("rep_history_test_1");
		expect(retrieved).not.toBeNull();
		expect(retrieved?.id).toBe("rep_history_test_1");

		const retrievedBySlug = await manager.getRun("distributed-consensus");
		expect(retrievedBySlug).not.toBeNull();
		expect(retrievedBySlug?.topic).toBe("Distributed Consensus Protocols");
	});

	it("deletes a research run by ID or slug", async () => {
		await manager.saveRun(mockReport);
		let runs = await manager.listRuns();
		expect(runs.length).toBe(1);

		const deleted = await manager.deleteRun("rep_history_test_1");
		expect(deleted).toBe(true);

		runs = await manager.listRuns();
		expect(runs.length).toBe(0);

		const deleteNonExistent = await manager.deleteRun("non-existent-id");
		expect(deleteNonExistent).toBe(false);
	});

	it("clears all research history", async () => {
		await manager.saveRun(mockReport);
		const secondReport = {
			...mockReport,
			metadata: { ...mockReport.metadata, id: "rep_2", slug: "second-run" },
		};
		await manager.saveRun(secondReport);

		let runs = await manager.listRuns();
		expect(runs.length).toBe(2);

		await manager.clearAll();
		runs = await manager.listRuns();
		expect(runs.length).toBe(0);
	});
});
