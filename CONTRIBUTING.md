# Contributing to AutoResearch Agent

First off, thank you for considering contributing to **AutoResearch Agent**! We build with pragmatic engineering principles: keep architecture decoupled, solve real problems cleanly, uphold rigorous security guardrails, and minimize bureaucracy.

---

## 📑 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Architecture & Codebase Tour](#architecture--codebase-tour)
- [Development Workflow](#development-workflow)
- [Code Style & Standards](#code-style--standards)
- [Security Guardrails](#security-guardrails)
- [Pull Request Checklist](#pull-request-checklist)
- [Commit Message Conventions](#commit-message-conventions)

---

## Code of Conduct

Be respectful, collaborative, and constructive. We welcome developers of all skill levels and backgrounds. Focus on the code, maintain high engineering standards, and support fellow contributors.

---

## Architecture & Codebase Tour

Before writing code, familiarize yourself with our module boundaries:

| Directory | Responsibility | Key Files |
| :--- | :--- | :--- |
| `src/core/` | Core research pipeline & orchestration | `engine.ts` (LCEL pipeline), `query-decomposer.ts` (multi-vector reasoning) |
| `src/tools/` | Search and web content fetching | `SearchManager.ts`, `DuckDuckGoSearcher.ts`, `GoogleSearcher.ts`, `WebFetcher.ts` |
| `src/exporters/` | Multi-format artifact generation | `markdown.ts` (YAML frontmatter), `html.ts` (responsive CSS/print styles), `json.ts` |
| `src/storage/` | Local library & persistent history | `history.ts` (`~/.autoresearch/history.json`) |
| `src/utils/` | Shared utilities & configuration | `config.ts` (`~/.autoresearch/config.json`), `http.ts` |
| `src/` | CLI entry point & user interface | `index.ts` (Commander.js + `@clack/prompts`) |
| `tests/` | Automated test suites | `*.test.ts` (Vitest unit and integration suites) |

---

## Development Workflow

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` LTS recommended)
- **npm**: `v9.0.0` or higher
- **Git**

### 2. Fork & Local Setup

```bash
# Clone your fork or the repository
git clone https://github.com/shenald-dev/autoresearch-agent.git
cd autoresearch-agent

# Install dependencies exactly as locked
npm install

# Build the TypeScript project
npm run build

# (Optional) Link globally to test the `autoresearch` binary in your terminal
npm link
```

### 3. Local Scripts

| Command | Description |
| :--- | :--- |
| `npm test` | Run the full [Vitest](https://vitest.dev/) test suite |
| `npm run lint` | Run [Biome](https://biomejs.dev/) static checks and linter |
| `npm run format` | Auto-format source code with Biome |
| `npm run build` | Compile TypeScript into `dist/` via `tsc` |
| `npm run dev` | Run TypeScript files in watch mode using `tsx` |
| `npm start -- <args>` | Execute the CLI locally via `tsx src/index.ts` |

---

## Code Style & Standards

1. **Tooling & Formatting**:
   - We use [Biome](https://biomejs.dev/) as our single source of truth for formatting, import sorting, and linting.
   - Always run `npm run format` and `npm run lint` before committing.
   - Indentation: Tabs (as configured in `biome.json`).
   - Semicolons: Required.
   - No unused variables or orphaned imports.

2. **TypeScript & Typing**:
   - Strict mode is enabled in `tsconfig.json`.
   - Avoid `any` wherever possible. Define explicit interfaces in module `types.ts` files.
   - Zero compiler warnings or errors allowed on `npm run build`.

3. **Function Design**:
   - Keep functions focused and cohesive.
   - Do not leave debug `console.log` statements in library/core code (use structured status callbacks or logger utilities).
   - Prefer pure functions with clear inputs and outputs for algorithmic logic (such as string sanitization, parsing, and query manipulation).

4. **Testing Rigor**:
   - Every bug fix must include a regression test reproducing the original issue.
   - Every new feature must include targeted unit/integration tests covering both happy paths and edge cases (e.g., malformed HTML, network failures, empty responses).
   - Mock network boundaries (such as `fetch` or LLM calls) cleanly in `tests/`.

---

## Security Guardrails

Security is a first-class citizen in AutoResearch Agent:

- **SSRF Hardening**: Never bypass IP validation or allow connections to private IP ranges (`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, or `::1`). Any new network-fetching logic must route through `WebFetcher` or adhere to strict pre-dispatch DNS checks.
- **DNS Rebinding**: Never rely on a single DNS check before making a separate request to a resolved hostname. Maintain socket IP binding to prevent TOCTOU rebinding.
- **Credential Protection**: Configuration files containing API keys must be written with restricted POSIX `0600` permissions. Never log raw API keys to stdout, stderr, or artifact files.
- **Payload Limits**: Always guard against memory exhaustion (e.g., streaming size caps) when reading external web content.

---

## Pull Request Checklist

Before submitting a pull request, ensure you have completed the following steps:

- [ ] All tests pass cleanly (`npm test`).
- [ ] Linter passes with zero warnings or errors (`npm run lint`).
- [ ] Code is auto-formatted (`npm run format`).
- [ ] TypeScript compiles cleanly with zero diagnostics (`npm run build`).
- [ ] New unit or integration tests have been added in `tests/`.
- [ ] Updated `README.md` if changing CLI flags, configuration, or user-facing behavior.
- [ ] Updated `CHANGELOG.md` under `## [Unreleased]` using concise developer notes (`Added`, `Fixed`, `Optimized`, `Removed`).
- [ ] Commits are focused and atomic (avoid massive multi-concern PRs).

---

## Commit Message Conventions

We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` A new user-facing feature or capability
- `fix:` A bug fix or correction
- `docs:` Documentation changes only
- `refactor:` Code restructuring that neither fixes a bug nor adds a feature
- `perf:` Performance optimizations
- `test:` Adding or updating tests
- `chore:` Maintenance tasks, dependency bumps, or build configuration

**Examples:**
```text
feat: add zero-config DuckDuckGo search provider fallback
fix: prevent document truncation during HTML boilerplate stripping
docs: update CLI flags and system architecture in README
test: add test suite for multi-vector query decomposer
```

---

Thank you for helping make **AutoResearch Agent** faster, safer, and more powerful! 🚀
