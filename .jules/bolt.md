## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.
ed text. Semantic structural tags like `<header>` and `<aside>` should be preserved as they frequently contain essential content.

Action:
Expanded the HTML stripping regex in `WebFetcher` to safely remove complete and unclosed boilerplate tags without touching semantic tags to save LLM context window tokens and improve API efficiency.
Ensure rejected promises are caught and removed from the cache using `.catch()` or `try-catch` blocks within the async closure to prevent transient errors from being permanently cached. Do not commit temporary script files like `patch.js`.

## 2026-04-01 — Streaming External Payloads to Prevent OOM
Learning: Unbounded payloads from external sources using `await response.text()` represent a severe reliability and DoS risk.
Action: To prevent Out-Of-Memory (OOM) vulnerabilities when fetching external URLs, never load unbounded response bodies into memory. Stream the response using `response.body`, a `TextDecoder`, and an `AbortController` to process chunks and cancel the request once a safe byte limit (e.g., 500KB) is reached.
## 2024-04-02 — String Concatenation Bottleneck
Learning: While V8 optimizes standard string `+=` operations internally using ConsStrings for a small number of chunks, building strings iteratively inside loops that process numerous small chunks from network streams (e.g., `TextDecoder` over `response.body.getReader()`) causes memory thrashing and O(N^2) allocations for large payloads (e.g., ~500KB limits).
Action: Always use array buffering (`chunks.push(...)` and `chunks.join("")`) when reading and accumulating unbounded or large chunks from streams.

## 2025-04-08 — DNS Rebinding Risk with Validation Caching

Learning:
When applying Promise coalescing to cache DNS lookup and IP validation checks (e.g., `isValidUrl`) during concurrent URL fetching, caching the result indefinitely introduces a Server-Side Request Forgery (SSRF) via DNS rebinding. An attacker can change the DNS record to point to an internal IP after the initial successful validation.

Action:
Ensure `hostValidationCache` uses strict Promise coalescing. The cache should only store the pending promise while the lookup is in flight, and the cache entry must be deleted immediately upon resolution (using `.finally()`) regardless of success or failure. This prevents redundant concurrent lookups without exposing the application to DNS rebinding attacks. Additionally, preemptively deduplicate batch URLs using `new Set(urls)` to reduce initial overhead.

## 2026-04-17 — Fetch Network Calls Timeout Optimization

Learning:
When handling manual redirects in a loop with Node's native `fetch` and an `AbortSignal.timeout(ms)`, recreating the signal inside the loop resets the timeout on each iteration. Furthermore, errors thrown during the fetch (such as timeouts or parsing errors) leave unconsumed response streams if the `response` variable is scoped tightly within the `try` block.

Action:
Initialize the `AbortSignal` once outside the redirect loop to ensure the timeout strictly covers the entire request chain (DNS lookup, TCP, SSL, all redirects, and body streaming). Declare the `Response` variable outside the `try` block so it is accessible in the `catch` block, and always explicitly cancel the unconsumed response stream (e.g., `await response?.body?.cancel().catch(() => {});`) during exceptions to prevent socket leaks and memory thrashing.
## 2026-04-18 — Early Stream Abort for Unwanted Content Types

Learning:
Unbounded payloads from external sources using `await response.text()` represent a severe reliability and DoS risk, but even when streaming in chunks, downloading non-text content (e.g., PDFs, images, videos) wastes bandwidth and can lead to OOM errors since this agent processes only text.

Action:
To further prevent OOM vulnerabilities and performance bottlenecks, validate the `Content-Type` header immediately after a successful response. Cleanly abort the response stream (`response.body.cancel()`) if it indicates a known non-text/large binary format unless explicitly required. Ensure tests mocking native `fetch` include a properly instantiated `Headers` object.

## 2026-04-19 — ReadableStream Locked Cancellation

Learning:
When cancelling a native fetch `Response` stream in Node.js, calling `response.body.cancel()` will throw a `TypeError: Cannot cancel a locked stream` if a reader (e.g., `response.body.getReader()`) is actively locked. Because this throw is synchronous, it can bypass catch blocks that attempt to silence it with `.catch(() => {})`, causing an unhandled exception to bubble up and break reliability.

Action:
Always maintain a reference to the reader (`let reader = response.body.getReader()`). When handling explicit stream cleanup in error or early-return paths, check if the reader exists and call `await reader.cancel().catch(() => {})` instead of `response.body.cancel()`.
## 2026-04-20 — URL Deduplication & Strict SSRF Whitelisting

Learning:
Deduplicating requested URLs with `new Set(urls)` is ineffective if the caller requests multiple sections of the same page using different `#hash` fragments, resulting in redundant network and DNS calls. Additionally, relying on an IP blacklist for SSRF (e.g., matching "private", "loopback") is fragile as new reserved ranges might not be covered.

Action:
To optimize concurrent batch operations (e.g., fetching multiple URLs), normalize the targets (e.g., stripping `#hash` fragments from URLs) and preemptively deduplicate the input array before processing. To strengthen SSRF protection, use a strict whitelist approach where `ipaddr.parse(ip).range() === 'unicast'` to inherently block all private, loopback, and metadata ranges securely. Always ensure temporary execution scripts or patch files (e.g., `test-dedup.js`) used for modifying code during runs are deleted before committing.

## 2026-04-22 — Fetch Response stream cleanup

Learning:
When handling native `fetch` responses in Node.js, if `response.json()` throws an error (e.g., due to invalid JSON or an aborted request), the underlying stream has already been fully read, closed, or errored out. Manually calling `response.body.cancel()` in the specific catch block for `response.json()` is redundant and does not fix socket leaks. Additionally, wrapping `fetch` explicitly just to add a `.catch()` for `body.cancel()` is often unnecessary when `response.ok` checks are already cancelling unconsumed streams.

Action:
Focus on addressing real issues like missing normalized cache lookups, handling unclosed HTML tags from stream truncation, or unhandled promise rejections, rather than redundant manual body cleanup on consumed streams.
## 2026-04-23 — Cache Cleanup Completeness

Learning:
When caching operations using a normalized key (e.g., `normalizedUrl`) but handling exceptions for the original input (e.g., `targetUrl`), ensure both keys are deleted from the cache upon failure to avoid permanently caching error states. Previous caching logic failed to clear the normalized entry during early returns for HTTP errors, unsupported content types, and redirects, leading to poisoned caches and memory leaks.

Action:
Always audit all early-return paths in cached methods to ensure symmetric cache cleanup for both normalized and raw keys.

## 2026-04-24 — Testing CLI Code

Learning:
When writing tests for Node.js CLI entry points that parse `process.argv` or invoke `process.exit()`, ensure `process.argv` and `process.exit` are properly mocked before dynamically importing the entry file. This prevents the test runner (e.g., Vitest) from consuming its own arguments or exiting prematurely.

Action:
Ensure temporary script files used to construct or patch tests are deleted before running test verifications to maintain a clean repository. Use dynamic imports (`await import("../src/index.ts")`) within test cases to execute top-level script logic under mock conditions.

## 2024-04-25 — DNS Lookup Empty Array SSRF Bypass
Learning: `dns.lookup` with `{ all: true }` can return an empty array without throwing an error, which can bypass subsequent validation loops that expect at least one address to validate.
Action: Always explicitly check if the returned addresses array is empty (`!addresses || addresses.length === 0`) and reject the input if so, rather than assuming the validation loop will catch it.

## 2026-04-26 — Symmetric Caching
Learning: When caching operations using a normalized key (e.g., `normalizedUrl`), storing the result under both the normalized key and the un-normalized original input (e.g., `targetUrl`) creates a memory leak and redundancy. Subsequent fetches for the un-normalized URL will normalize it first anyway, making the `targetUrl` cache entry completely unreachable.
Action: Cache exclusively under the normalized key. Ensure all cache insertions and deletions only target `normalizedUrl` to prevent duplicate entries and ensure correct eviction on errors.

## 2026-04-28 — Engine Context Deduplication

Learning:
Identical content from different search result URLs can waste LLM tokens and slow down processing if not filtered.

Action:
Introduced a content-based deduplication mechanism in ResearchEngine using a Set to filter out duplicate context chunks, alongside an early return for empty context arrays.
## 2024-05-01 — ConfigManager memory caching and WebFetcher deduplication

Learning:
I combined ConfigManager file read caching with WebFetcher target optimization to improve performance. The review highlighted that combining fixes from separate domains is not aligned with the "ONE meaningful improvement only" philosophy and raised minor side effect semantics with the config caching.

Action:
Ensure each run strictly focuses on a single file or a unified performance path. Do not mix database IO (like config reads) optimizations with network performance code changes (like WebFetcher) in the same run to adhere to the core guidelines. Always cleanup test scripts.

## 2026-05-03 — SVG Content Stripping

Learning:
SVG blocks in HTML payloads can be large and contain only graphical data, which is useless for a text-based LLM and wastes context window tokens and memory.

Action:
Updated the HTML stripping regex to include `<svg>` alongside `<script>` and `<style>` blocks to drop this unwanted content early.

## 2026-05-04 — Map Iteration Order in Concurrent Asynchronous Tasks

Learning:
In JavaScript/TypeScript, `Map` iteration strictly follows insertion order. When running concurrent asynchronous tasks (like `Promise.all` fetching multiple URLs) and dynamically calling `Map.set()` as each task completes, the iteration order of the final Map will randomly reflect task completion times rather than the original input order. This breaks downstream logic that relies on the sequence (e.g., maintaining search result ranking relevance for LLM context).

Action:
To ensure deterministic ordering and prevent race conditions from scrambling context relevance, always pre-initialize the `Map` keys with empty values in the desired sequence before executing concurrent async tasks. Subsequent `Map.set()` calls during task completion will update the values in place without altering the established insertion order.

## 2026-05-07 — Boilerplate Content Stripping

Learning:
While removing `<script>`, `<style>`, and `<svg>` blocks helps save LLM context window tokens, typical web pages contain other boilerplate elements that are not useful for text-based analysis, such as navigation bars (`<nav>`), footers (`<footer>`), inline frames (`<iframe>`), and fallback content (`<noscript>`).

Action:
Expanded the HTML stripping regex to include `nav`, `footer`, `iframe`, and `noscript` tags to further reduce payload size and conserve LLM context tokens. Ensured semantic structural tags like `<header>` or `<aside>` are not removed, as they frequently contain essential content.
## 2026-05-11 — Expand HTML Stripping Regex

Learning:
Unnecessary boilerplate elements such as `<nav>`, `<footer>`, `<iframe>`, and `<noscript>` consume valuable context tokens and add no semantic value to the extracted text. Semantic structural tags like `<header>` and `<aside>` should be preserved as they frequently contain essential content.

Action:
Expanded the HTML stripping regex in `WebFetcher` to safely remove complete and unclosed boilerplate tags without touching semantic tags to save LLM context window tokens and improve API efficiency.
## 2024-05-19 — Dynamic Charset Decoding for Web Fetcher
Learning:
Defaulting to utf-8 in TextDecoder can fail or produce mangled text on non-utf-8 websites, hurting data extraction quality.

Action:
Extract the charset from the Content-Type header using a regex, and use it to instantiate TextDecoder with a try-catch fallback to utf-8.

## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.
## 2026-05-21 — Preemptive HTML Comment Stripping
Learning: Web documents frequently contain massive HTML comments that may harbor nested, unbroken, or malformed tags, which can trigger parsing anomalies and waste substantial LLM context tokens.
Action: Preemptively strip all HTML comments using regex before standard boilerplate tag cleanup during document processing.

## 2026-05-18 — TextDecoder Charset Optimization

Learning:
When decoding fetched HTTP response bodies using `TextDecoder`, defaulting to `utf-8` without extracting the `charset` from the `Content-Type` header can lead to corrupted text. Always extracting the `charset` and wrapping the `TextDecoder` instantiation in a `try...catch` block prevents runtime crashes from invalid or unsupported character sets.

Action:
Ensure `TextDecoder` uses the `charset` extracted from the `Content-Type` header (handling optional quotes via regex) and falls back to `utf-8` if the charset is invalid or unsupported. To prevent Biome linting errors, explicitly declare the `decoder` variable with its type (e.g., `let decoder: TextDecoder;`) before the `try...catch` block.

## 2026-05-21 — Preemptive HTML Comment Stripping
Learning: Web documents frequently contain massive HTML comments that may harbor nested, unbroken, or malformed tags, which can trigger parsing anomalies and waste substantial LLM context tokens.
Action: Preemptively strip all HTML comments using regex before standard boilerplate tag cleanup during document processing.

## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8, catching only specific errors.
## 2024-05-16 — TextDecoder Charset Optimization

Learning:
When decoding HTTP response bodies using `TextDecoder`, assuming `utf-8` by default can lead to incorrect decoding and silent failures for sites using other character sets (like ISO-8859-1).

Action:
Extract the `charset` from the `Content-Type` header using a regex that handles optional quotes to instantiate `TextDecoder(charset)`. Always wrap this in a `try...catch` block with a fallback to `new TextDecoder('utf-8')` to prevent runtime crashes from invalid or unsupported character sets.
## 2026-05-12 — TextDecoder Custom Charset Parsing

Learning:
When decoding fetched HTTP response bodies using `TextDecoder`, assuming `utf-8` by default can corrupt textual data from servers returning other encodings (e.g., `iso-8859-1` or `windows-1252`), breaking HTML parsing and LLM context extraction.

Action:
Extract the `charset` from the `Content-Type` header using a regex that handles optional quotes (e.g., `contentType.match(/charset=['"]?([\w-]+)['"]?/i)`) to instantiate `TextDecoder(charset)`. Always wrap this instantiation in a `try...catch` block with a fallback to `new TextDecoder('utf-8')` to prevent runtime crashes from invalid or unsupported character sets.

## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.
## 2026-05-21 — Preemptive HTML Comment Stripping
Learning: Web documents frequently contain massive HTML comments that may harbor nested, unbroken, or malformed tags, which can trigger parsing anomalies and waste substantial LLM context tokens.
Action: Preemptively strip all HTML comments using regex before standard boilerplate tag cleanup during document processing.

## 2026-05-26 — Strict Allowlist for Fetch Content Types
Learning: A blocklist approach for rejecting non-text payloads (e.g., matching 'pdf', 'image/', 'video/') allows other arbitrary binaries (like zip, exe, audio) to be downloaded up to the 500KB limit, wasting bandwidth, memory, and CPU decoding garbage data.
Action: Implemented a strict allowlist in WebFetcher that only processes `text/`, `application/json`, `application/xml`, and `application/xhtml`, aggressively aborting streams for all other binary formats early.

## 2024-05-14 — Fetcher Character Encoding Fix

Learning:
When fetching web content, assuming `utf-8` by default can lead to garbled text or crashes if the server responds with a different character set. `TextDecoder` should dynamically parse the `Content-Type` header.

Action:
Always extract the `charset` from `Content-Type` and wrap `new TextDecoder(charset)` in a try/catch block with a safe fallback to prevent crashes.
## 2026-05-26 — Strict Allowlist for Fetch Content Types
Learning: A blocklist approach for rejecting non-text payloads (e.g., matching 'pdf', 'image/', 'video/') allows other arbitrary binaries (like zip, exe, audio) to be downloaded up to the 500KB limit, wasting bandwidth, memory, and CPU decoding garbage data.
Action: Implemented a strict allowlist in WebFetcher that only processes `text/`, `application/json`, `application/xml`, and `application/xhtml`, aggressively aborting streams for all other binary formats early.
## 2026-05-30 — Awaiting Commander Commands in Tests

Learning:
When testing a Node CLI entry point that uses `commander` with async actions, calling `program.parse()` and waiting via `setTimeout` in the test leads to race conditions and test flakiness.

Action:
Export the result of `program.parseAsync()` from the entry point and `await` it explicitly in the test to ensure all async actions complete before making assertions.
## 2026-06-03 — Self-Closing HTML Tags Truncation

Learning:
When stripping boilerplate HTML tags using a regex designed to remove complete and unclosed blocks (e.g., `/<tag\b[^>]*>[\s\S]*?(?:<\/\1>|$)/gi`), encountering a self-closing tag (like `<script src="..." />`) causes the regex to incorrectly consume and discard the entire remainder of the document because it never finds the closing tag.

Action:
Preemptively strip self-closing boilerplate tags using a targeted regex (e.g., `/<tag\b[^>]*\/>/gi`) before applying the full boilerplate regex to prevent massive data loss during extraction.
## 2024-05-31 — Remove Unused Dependencies

Learning:
The `cheerio` and `console-table-printer` dependencies were imported/installed but not actively utilized in the codebase. Removing them reduces the package footprint, decreases bundle size, and lowers attack surface area.

Action:
Removed unused dependencies via `npm uninstall` and cleaned up dead code imports to keep the project lean and maintainable.

## 2024-05-18 — DNS Rebinding Vulnerability in SSRF Validation

Learning:
When implementing SSRF validation via DNS lookups, persistently caching the validation result across sequential requests introduces a DNS Rebinding vulnerability. An attacker can serve a safe IP on the first lookup (which gets cached as safe) and then change the DNS record to point to an internal IP (like 127.0.0.1) for subsequent fetches, bypassing the SSRF protection entirely.

Action:
Only cache the DNS validation promise for in-flight concurrent requests (request coalescing) and clear it immediately upon resolution. This prevents redundant lookups during a single batch fetch without persistently caching a potentially stale and dangerous DNS resolution.
