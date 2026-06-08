# CHANGELOG.md

## [1.0.41] - 2026-06-08
* **[Chore]:** Routine maintenance and structural verification.

## [1.0.40] - 2026-06-08

- e51970e chore(sentinel): update monitoring log
- d6f21df chore(warden): update ledger
- c360c26 chore(release): v1.0.39
- ef934fd chore(sentinel): update monitoring log
- 3fb73af Merge pull request #168 from shenald-dev/jules-5177095139123476073-57fd5496
- c0fb96f I have finished the task and the final result is ready for you.
- 8dea139 Merge pull request #167 from shenald-dev/jules-13710994976568883044-42195d1a
- ffebd18 I have completed the task and the final results are ready.
- efa2362 Overhaul README with enterprise documentation
- bb8d1a9 Update README with awesome new logo and formatting

# Changelog

## [1.0.39] - 2026-06-07
* **[Fixed]:** Resolved recent merge conflicts to ensure codebase stability.
* **[Documentation]:** Overhauled README with enterprise documentation, updated logo, and improved formatting.
* **[Chore]:** Updated monitoring logs.
* **[Optimized]:** Safely deduplicated URLs.

All notable changes to autoresearch-agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
## [1.0.38] - 2026-06-03
* **[Optimized]:** Replaced `setTimeout` with `await cliPromise` in `index.test.ts` to fix race conditions.
* **[Optimized]:** Added targeted regex to preemptively strip self-closing boilerplate tags in `WebFetcher`.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

## [1.0.27] - 2026-05-06
* **[Optimized]:** Reused `ConfigManager` instance across CLI and core services to optimize file reads.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

## [1.0.35] - 2026-05-31

* **[Dead Code]:** Removed unused `console-table-printer` dependency and removed orphaned helper scripts.
* **[Dependencies]:** Safely bumped minor and patch dependencies.

## [1.0.33] - 2026-05-29
* **[Fixed]:** Fixed unhandled Promise rejection in `cliPromise` when awaiting `ResearchEngine.run` by resolving async test concurrency issues and correctly awaiting the CLI execution in tests.
## [1.0.39] - 2026-05-28
* **[Fixed]:** Successfully resolved cascading merge conflicts with the `master` branch, protecting the strict `Content-Type` allowlist, the preemptive HTML comment stripping, and all previously consolidated optimizations for HTTP fetching and charset decoding.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

## [1.0.32] - 2026-05-28
* **[Dead Code]:** Removed unused dependency `console-table-printer`.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

## [1.0.31] - 2026-05-27
* **[Security]:** Enforced strict Content-Type allowlist in WebFetcher to prevent downloading arbitrary large binaries.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

## [1.0.30] - 2026-0
