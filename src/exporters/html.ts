import type { ReportData } from "./types";

function escapeHtml(text: string): string {
	return text
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#39;");
}

/**
 * Lightweight, zero-dependency Markdown-to-HTML renderer for generated reports.
 */
function renderMarkdownToHtml(markdown: string): string {
	let html = escapeHtml(markdown);

	// Code blocks: ```lang\ncode\n```
	html = html.replace(
		/```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g,
		'<pre><code class="language-$1">$2</code></pre>',
	);

	// Inline code: `code`
	html = html.replace(/`([^`]+)`/g, "<code>$1</code>");

	// Headers: # h1, ## h2, ### h3, #### h4
	html = html.replace(/^#### (.*?)$/gm, "<h4>$1</h4>");
	html = html.replace(/^### (.*?)$/gm, "<h3>$1</h3>");
	html = html.replace(/^## (.*?)$/gm, "<h2>$1</h2>");
	html = html.replace(/^# (.*?)$/gm, "<h1>$1</h1>");

	// Blockquotes
	html = html.replace(/^> (.*?)$/gm, "<blockquote>$1</blockquote>");

	// Bold and Italics
	html = html.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
	html = html.replace(/\*([^*]+)\*/g, "<em>$1</em>");
	html = html.replace(/_([^_]+)_/g, "<em>$1</em>");

	// Markdown links: [text](url)
	html = html.replace(
		/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
		'<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>',
	);

	// Unordered lists: - item
	html = html.replace(
		/(?:^|\n)- (.*?)(?=(?:\n[^-]|\n\n|$))/g,
		"\n<ul><li>$1</li></ul>",
	);
	html = html.replace(/<\/ul>\s*<ul>/g, "");

	// Horizontal rules
	html = html.replace(/^---$/gm, "<hr />");

	// Paragraphs: separate double newlines
	const blocks = html.split(/\n\s*\n/);
	const formattedBlocks = blocks.map((block) => {
		const trimmed = block.trim();
		if (!trimmed) return "";
		if (/^<(h[1-4]|pre|ul|ol|blockquote|hr)/i.test(trimmed)) {
			return trimmed;
		}
		return `<p>${trimmed.replace(/\n/g, "<br />")}</p>`;
	});

	return formattedBlocks.filter(Boolean).join("\n\n");
}

export function generateHtmlReport(data: ReportData): string {
	const { metadata, markdown, sources, subQueries } = data;
	const bodyHtml = renderMarkdownToHtml(markdown);

	return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(metadata.topic)} - AutoResearch Report</title>
  <style>
    :root {
      --bg: #0f172a;
      --card-bg: #1e293b;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --border: #334155;
      --accent: #38bdf8;
      --accent-hover: #0284c7;
      --badge-bg: #0369a1;
      --code-bg: #0b1120;
    }
    @media (prefers-color-scheme: light) {
      :root {
        --bg: #f8fafc;
        --card-bg: #ffffff;
        --text: #0f172a;
        --text-muted: #64748b;
        --border: #e2e8f0;
        --accent: #0284c7;
        --accent-hover: #0369a1;
        --badge-bg: #e0f2fe;
        --code-bg: #f1f5f9;
      }
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      background-color: var(--bg);
      color: var(--text);
      line-height: 1.65;
      padding: 2.5rem 1.5rem;
    }
    .container {
      max-width: 900px;
      margin: 0 auto;
    }
    header {
      margin-bottom: 2.5rem;
      padding-bottom: 2rem;
      border-bottom: 1px solid var(--border);
    }
    .badge-bar {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      padding: 0.25rem 0.75rem;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      background: var(--badge-bg);
      color: var(--accent);
      border: 1px solid var(--border);
    }
    h1 {
      font-size: 2.25rem;
      font-weight: 800;
      line-height: 1.25;
      margin-bottom: 0.75rem;
      letter-spacing: -0.025em;
    }
    .meta-text {
      font-size: 0.9rem;
      color: var(--text-muted);
    }
    .content {
      background: var(--card-bg);
      padding: 2.5rem;
      border-radius: 1rem;
      border: 1px solid var(--border);
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .content h1, .content h2, .content h3, .content h4 {
      color: var(--text);
      margin-top: 1.75rem;
      margin-bottom: 0.75rem;
      font-weight: 700;
    }
    .content h2 { border-bottom: 1px solid var(--border); padding-bottom: 0.35rem; }
    .content p { margin-bottom: 1.25rem; }
    .content ul, .content ol { margin-left: 1.5rem; margin-bottom: 1.25rem; }
    .content li { margin-bottom: 0.5rem; }
    .content a { color: var(--accent); text-decoration: none; font-weight: 500; }
    .content a:hover { text-decoration: underline; }
    .content blockquote {
      border-left: 4px solid var(--accent);
      padding: 0.75rem 1.25rem;
      background: var(--code-bg);
      margin: 1.5rem 0;
      border-radius: 0 0.5rem 0.5rem 0;
      color: var(--text-muted);
      font-style: italic;
    }
    .content code {
      background: var(--code-bg);
      padding: 0.2rem 0.4rem;
      border-radius: 0.25rem;
      font-size: 0.875rem;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      border: 1px solid var(--border);
    }
    .content pre {
      background: var(--code-bg);
      padding: 1.25rem;
      border-radius: 0.5rem;
      overflow-x: auto;
      margin: 1.5rem 0;
      border: 1px solid var(--border);
    }
    .sources-section {
      margin-top: 2.5rem;
      padding-top: 2rem;
      border-top: 1px solid var(--border);
    }
    .source-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .source-card {
      background: var(--code-bg);
      padding: 1rem;
      border-radius: 0.5rem;
      border: 1px solid var(--border);
      font-size: 0.85rem;
    }
    .source-card a {
      color: var(--accent);
      font-weight: 600;
      word-break: break-all;
    }
    .source-snippet {
      margin-top: 0.4rem;
      color: var(--text-muted);
      line-height: 1.4;
    }
    footer {
      margin-top: 3rem;
      text-align: center;
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    @media print {
      body { background: white; color: black; padding: 0; }
      .content { border: none; box-shadow: none; padding: 0; }
      .badge, footer { display: none; }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <div class="badge-bar">
        <span class="badge">🧠 AutoResearch v1.0</span>
        <span class="badge">Depth ${metadata.depth}</span>
        <span class="badge">${metadata.sourcesCount} Sources</span>
        <span class="badge">${escapeHtml(metadata.model)}</span>
      </div>
      <h1>${escapeHtml(metadata.topic)}</h1>
      <div class="meta-text">Generated on ${new Date(metadata.createdAt).toLocaleString()} • Report ID: <code>${escapeHtml(metadata.id)}</code></div>
    </header>

    <main class="content">
      ${bodyHtml}

      ${
				sources.length > 0
					? `
      <section class="sources-section">
        <h2>🌐 Verified Sources (${sources.length})</h2>
        <div class="source-grid">
          ${sources
						.map(
							(s) => `
            <div class="source-card">
              <div><strong>[Source ${s.index}]</strong> <a href="${escapeHtml(s.url)}" target="_blank" rel="noopener noreferrer">${escapeHtml(s.title || s.url)}</a></div>
              ${s.snippet ? `<div class="source-snippet">${escapeHtml(s.snippet)}</div>` : ""}
            </div>
          `,
						)
						.join("")}
        </div>
      </section>`
					: ""
			}
    </main>

    <footer>
      Generated autonomously by <strong>AutoResearch Agent</strong>. Verified and cross-referenced across ${subQueries.length} investigation vectors.
    </footer>
  </div>
</body>
</html>`;
}
