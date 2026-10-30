import type { ReportData } from "./types";

export function generateMarkdownReport(data: ReportData): string {
	const { metadata, markdown, sources, subQueries } = data;

	const frontmatter = `---
title: "Research Report: ${metadata.topic.replace(/"/g, '\\"')}"
date: ${metadata.createdAt}
depth: ${metadata.depth}
model: ${metadata.model}
sources_analyzed: ${metadata.sourcesCount}
id: ${metadata.id}
---

`;

	let body = markdown.trim();

	// If body does not contain an explicit references/sources section, append formatted bibliography
	if (
		!body.toLowerCase().includes("## references") &&
		!body.toLowerCase().includes("## sources") &&
		sources.length > 0
	) {
		const bibliography = [
			"\n\n## 📚 Sources & Bibliography",
			...sources.map((s) => {
				const title = s.title || s.url;
				return `- **[Source ${s.index}]** [${title}](${s.url})${s.snippet ? ` — _${s.snippet}_` : ""}`;
			}),
		].join("\n");

		body += bibliography;
	}

	// Append research metadata notes
	const methodology = `

---
*Generated autonomously by **AutoResearch Agent** on ${new Date(metadata.createdAt).toUTCString()}.*
*Investigation Vectors (${subQueries.length}):*
${subQueries.map((q) => `  - \`${q}\``).join("\n")}
`;

	return `${frontmatter}${body}${methodology}`;
}
