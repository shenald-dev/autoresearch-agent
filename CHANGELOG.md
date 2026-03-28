# Changelog

All notable changes to autoresearch-agent will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

