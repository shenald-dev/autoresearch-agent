## 2026-03-31 — Caching Network API Calls

Learning:
When caching network-heavy API calls like `GoogleSearcher.search()`, caching the `Promise` immediately rather than awaiting the result effectively implements Promise Coalescing, preventing cache stampedes from concurrent identical requests.

Action:
Ensure rejected promises are caught and removed from the cache using `.catch()` or `try-catch` blocks within the async closure to prevent transient errors from being permanently cached. Do not commit temporary script files like `patch.js`.

## 2026-04-01 — Streaming External Payloads to Prevent OOM
Learning: Unbounded payloads from external sources using `await response.text()` represent a severe reliability and DoS risk.
Action: To prevent Out-Of-Memory (OOM) vulnerabilities when fetching external URLs, never load unbounded response bodies into memory. Stream the response using `response.body`, a `TextDecoder`, and an `AbortController` to process chunks and cancel the request once a safe byte limit (e.g., 500

// ... 10849.6 characters truncated (middle section) ...

ecoder`, defaulting to `utf-8` without extracting the `charset` from the `Content-Type` header can lead to corrupted text. Always extracting the `charset` and wrapping the `TextDecoder` instantiation in a `try...catch` block prevents runtime crashes from invalid or unsupported character sets.

Action:
Ensure `TextDecoder` uses the `charset` extracted from the `Content-Type` header (handling optional quotes via regex) and falls back to `utf-8` if the charset is invalid or unsupported. To prevent Biome linting errors, explicitly declare the `decoder` variable with its type (e.g., `let decoder: TextDecoder;`) before the `try...catch` block.

## 2026-05-11 — Expand HTML Stripping Regex

Learning:
Unnecessary boilerplate elements such as `<nav>`, `<footer>`, `<iframe>`, and `<noscript>` consume valuable context tokens and add no semantic value to the extracted text. Semantic structural tags like `<header>` and `<aside>` should be preserved as they frequently contain essential content.

Action:
Expanded the HTML stripping regex in `WebFetcher` to safely remove complete and unclosed boilerplate tags without touching semantic tags to save LLM context window tokens and improve API efficiency.