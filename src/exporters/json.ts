import type { ReportData } from "./types";

export function generateJsonReport(data: ReportData): string {
	return JSON.stringify(data, null, 2);
}
