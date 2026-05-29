## 2026-05-26 — Strict Allowlist for Fetch Content Types
Learning: A blocklist approach for rejecting non-text payloads (e.g., matching 'pdf', 'image/', 'video/') allows other arbitrary binaries (like zip, exe, audio) to be downloaded up to the 500KB limit, wasting bandwidth, memory, and CPU decoding garbage data.
Action: Implemented a strict allowlist in WebFetcher that only processes `text/`, `application/json`, `application/xml`, and `application/xhtml`, aggressively aborting streams for all other binary formats early.

## 2026-05-30 — Awaiting Commander Commands in Tests

Learning:
When testing a Node CLI entry point that uses `commander` with async actions, calling `program.parse()` and waiting via `setTimeout` in the test leads to race conditions and test flakiness.

Action:
Export the result of `program.parseAsync()` from the entry point and `await` it explicitly in the test to ensure all async actions complete before making assertions.