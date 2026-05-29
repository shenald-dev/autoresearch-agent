## 2026-03-31 — Caching Network API Calls

        Learning:
        When caching network-heavy API calls like `GoogleSearcher.search()`, caching the `Promise` immediately rather than awaiting the result effectively implements Promise Coalescing, preventing cache stampedes from concurrent identical requests.

        Action:
        Ensure rejected promises are caught and removed from the cache using `.catch()` or `try-catch` blocks within the async closure to prevent transient errors from being permanently cached. Do not commit temporary script files like `patch.js`.

        ## 2026-04-01 — Streaming External Payloads to Prevent OOM
        Learning: Unbounded payloads from external sources using `await response.text()` repres

        // ... 12038.6 characters truncated (middle section) ...

        ndwidth, memory, and CPU decoding garbage data.
        Action: Implemented a strict allowlist in WebFetcher that only processes `text/`, `application/json`, `application/xml`, and `application/xhtml`, aggressively aborting streams for all other binary formats early.

        ## 2026-05-30 — Awaiting Commander Commands in Tests

        Learning:
        When testing a Node CLI entry point that uses `commander` with async actions, calling `program.parse()` and waiting via `setTimeout` in the test leads to race conditions and test flakiness.

        Action:
        Export the result of `program.parseAsync()` from the entry point and `await` it explicitly in the test to ensure all async actions complete before making assertions.