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
## 2025-04-10 — Improved Error Handling for Configuration Saving

Learning:
The `ConfigManager.setConfig()` method was silently swallowing `fs.mkdir` filesystem errors using an empty `catch` block, which could lead to obscure errors down the line during `fs.writeFile`. Also, the caller (`src/index.ts`) wasn't handling potential failures gracefully.

Action:
Removed the empty catch block in `ConfigManager.setConfig()` to allow filesystem errors (e.g., permissions) to propagate naturally. Also wrapped the `configManager.setConfig()` call in `src/index.ts` with a `try...catch` block. This ensures that when saving the config fails, the CLI spinner is properly stopped with a user-friendly error message, and the process exits with a non-zero status code (`process.exit(1)`).
