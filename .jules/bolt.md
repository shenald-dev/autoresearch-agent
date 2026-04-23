## 2026-03-31 — Caching Network API Calls

Learning:
When caching network-heavy API calls like `GoogleSearcher.search()`, caching the `Promise` immediately rather than awaiting the result effectively implements Promise Coalescing, preventing cache stampedes from concurrent identical requests.

Action:
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
