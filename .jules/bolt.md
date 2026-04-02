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
