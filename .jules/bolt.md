## 2026-05-11 — Expand HTML Stripping Regex

Learning:
Unnecessary boilerplate elements such as `<nav>`, `<footer>`, `<iframe>`, and `<noscript>` consume valuable context tokens and add no semantic value to the extracted text. Semantic structural tags like `<header>` and `<aside>` should be preserved as they frequently contain essential content.

Action:
Expanded the HTML stripping regex in `WebFetcher` to safely remove complete and unclosed boilerplate tags without touching semantic tags to save LLM context window tokens and improve API efficiency.

## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.