## 2026-03-31 — Caching Network API Calls

        Learning:
        When caching network-heavy API calls like `GoogleSearcher.search()`, caching the `Promise` immediately rather than awaiting the result effectively implements Promise Coalescing, preventing cache stampedes from concurrent identical requests.

        Action:
        Ensure rejected promises are caught and removed from

        // ... 10475.2 characters truncated (middle section) ...

        ion:
        To ensure deterministic ordering and prevent race conditions from scrambling context relevance, always pre-initialize the `Map` keys with empty values in the desired sequence before executing concurrent async tasks. Subsequent `Map.set()` calls during task completion will update the values in place without altering the established insertion order.