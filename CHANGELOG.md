# Changelog

All notable changes to autoresearch-agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.6] - 2026-04-01
* **[Fixed]:** Fixed TCP socket connection pooling exhaustion and memory leaks by explicitly invoking `.cancel()` on unconsumed Node.js `fetch` response streams in both `WebFetcher` and `GoogleSearcher`.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

## [1.0.5] - 2026-03-31
* **[Security]:** Enhanced SSRF protection by explicitly handling HTTP redirects to prevent automatic Node.js native `fetch` bypasses into internal or malicious IP addresses.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies via `npm update`.

## [1.0.4] - 2026-03-30
* **[Optimized]:** Implemented dynamic concurrency bounds based on research depth to improve web scraping performance without overwhelming resources.
* **[Security]:** Enhanced SSRF protection by adding rigorous IP bound and loopback validation, explicitly blocking AWS metadata endpoints and IPv6 edge-cases.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies.

## [1.0.3] - 2026-03-28
* **[Fixed]:** Resolved TypeScript error `Namespace '"node:dns/promises"' has no exported member 'LookupAddress'` in `WebFetcher` by using an inline interface.
* **[Pruned]:** Removed unused `SearchResult` export from `GoogleSearcher.ts`.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies.

## [1.0.2] - 2026-03-28
* **[Security]:** Fixed SSRF loopback bypass vulnerability by validating hostnames.
* **[Pruned]:** Removed dead test configuration files and logs (Jest files, error logs, unused mocks) as the project now uses Vitest.
* **[Dependencies]:** Safely bumped minor/patch versions of dependencies.

## [1.0.1] - 2026-03-27
* **[Fixed]:** Replaced `any` types with explicit `unknown` and `Record<string, unknown>` types for better type safety.
* **[Fixed]:** Resolved Biome linter warnings by strictly organizing imports and using `node:` protocol for built-in modules.
* **[Changed]:** Bumped minor/patch versions of dependencies (`npm update`).

## [0.1.0] - YYYY-MM-DD

### Added
- Initial release
- Core functionality: autonomous research-to-content pipeline
- CLI with basic options
- Health check endpoint
- Docker support

