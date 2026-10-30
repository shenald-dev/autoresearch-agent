<div align="center">
  <img src="assets/logo.png" alt="AutoResearch Agent Logo" width="220" />

  <h1>✨ AutoResearch Agent</h1>
  <p><b>Production-Grade Autonomous Multi-Vector Deep Research & Synthesis Engine</b></p>
  <i>Investigate complex topics across multi-hop query vectors, scrape verified sources with enterprise SSRF protection, fallback to zero-config search, and generate publication-ready Markdown, HTML, and JSON reports in seconds.</i>

  <br/><br/>

  [![CI](https://github.com/shenald-dev/autoresearch-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/shenald-dev/autoresearch-agent/actions/workflows/ci.yml)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![LangChain](https://img.shields.io/badge/LangChain-LCEL-orange.svg)](https://langchain.com)
  [![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-729B1B.svg?logo=vitest)](https://vitest.dev/)
  [![Tests](https://img.shields.io/badge/Tests-82%20passing-brightgreen.svg)]()
  [![Biome](https://img.shields.io/badge/Code%20Style-Biome-60a5fa.svg?logo=biome)](https://biomejs.dev/)
  [![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](LICENSE)
</div>

---

## 📑 Table of Contents
- [🌟 Overview](#-overview)
- [🚀 Key Innovations](#-key-innovations)
- [🗺️ System Architecture](#️-system-architecture)
- [⚡ Quick Start Guide](#-quick-start-guide)
- [🔐 Multi-Provider Configuration](#-multi-provider-configuration)
- [💻 CLI Usage & Commands](#-cli-usage--commands)
  - [`research`](#1-autoresearch-research)
  - [`list`](#2-autoresearch-list)
  - [`view`](#3-autoresearch-view)
  - [`auth`](#4-autoresearch-auth)
- [📁 Multi-Format Report Artifacts](#-multi-format-report-artifacts)
- [🛡️ Enterprise Security & Hardening](#️-enterprise-security--hardening)
- [🧪 Development & Verification](#-development--verification)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

**AutoResearch Agent** is an autonomous deep-research intelligence tool designed for engineers, researchers, and technical leaders. Instead of manually juggling dozens of browser tabs, copy-pasting fragmented excerpts, and wrestling with paywalled or broken links, AutoResearch acts as your autonomous research squad.

Given any research inquiry, the agent:
1. **Decomposes** the topic into targeted investigation vectors (foundational architecture, technical trade-offs, benchmarks, production post-mortems).
2. **Orchestrates Search** with automatic zero-config fallback: leverages Google Serper when configured, or transparently falls back to DuckDuckGo search without requiring third-party search subscriptions.
3. **Scrapes Concurrently** through an SSRF-hardened, DNS-rebinding-immune HTTP client that strips navigation boilerplate, ads, and scripts.
4. **Synthesizes Insights** using modern LangChain Expression Language (LCEL) chains connected to OpenAI, DeepSeek, Ollama, or custom local LLM endpoints.
5. **Exports Multi-Format Artifacts** including structured Markdown with frontmatter, standalone styled interactive HTML reports (with dark/light theme parity and print styles for PDF export), and JSON datasets into your personal research library.

---

## 🚀 Key Innovations

- **🔍 Multi-Vector Query Decomposition**: Dynamically formulates orthogonal search vectors based on depth (1–5) using LLM reasoning with deterministic heuristic fallbacks.
- **🌐 Zero-Config Search Provider**: Ready to run out-of-the-box. If `SERPER_API_KEY` is not present, queries automatically route through an intelligent DuckDuckGo scraper with redirect un-wrapping and entity decoding.
- **📄 Multi-Format Publication Exporters**: Automatically compiles every research session into:
  - `report.md`: High-density Markdown with YAML frontmatter and contiguous source footnotes.
  - `report.html`: Standalone, responsive HTML report featuring embedded modern dark/light CSS, interactive source cards, badge headers, and `@media print` rules for one-click PDF saving.
  - `report.json`: Machine-readable metadata, source bibliography, and query audit trail.
- **📚 Local Research Library & Viewer**: Manage, inspect, and open past research runs with `autoresearch list` and `autoresearch view <id|slug> [--open]`.
- **🔌 Multi-Provider LLM Integration**: Full support for custom `OPENAI_BASE_URL` and custom `OPENAI_MODEL`, enabling seamless integration with local Ollama instances, LM Studio, DeepSeek, Groq, or vLLM.
- **🛡️ SSRF & DNS-Rebinding Hardening**: Custom `undici.Agent` pre-resolves DNS, strictly validates public unicast ranges via `ipaddr.js`, blocks loopback, private RFC-1918, link-local, and cloud metadata addresses (169.254.169.254), and binds sockets directly to verified IPs.
- **⚡ Bounded Concurrency & Streaming Memory Guard**: Concurrently fetches web pages via `p-limit` with strict 500KB early payload caps, preventing out-of-memory crashes on bloated web pages.

---

## 🗺️ System Architecture

```text
                                   ┌─────────────────────────────────────────┐
                                   │       User Inquiry / CLI Prompt         │
                                   └────────────────────┬────────────────────┘
                                                        │
                                                        ▼
                                   ┌─────────────────────────────────────────┐
                                   │      Multi-Vector Query Decomposer      │
                                   │  • Depth-scaled orthogonal vectors      │
                                   │  • LLM reasoning & heuristic fallback   │
                                   └────────────────────┬────────────────────┘
                                                        │
                                                        ▼
                        ┌───────────────────────────────────────────────────────────────┐
                        │                 Search Orchestration Manager                  │
                        │   • Primary: Google Serper API (when key configured)          │
                        │   • Zero-Config Fallback: DuckDuckGo HTML Scraper             │
                        │   • Cross-query canonical URL deduplication                   │
                        └───────────────────────────────┬───────────────────────────────┘
                                                        │
                                                        ▼
                        ┌───────────────────────────────────────────────────────────────┐
                        │             SSRF-Hardened Web Content Fetcher                 │
                        │   • DNS pre-lookup & ipaddr.js strict public IP filtering     │
                        │   • Socket pinning (immune to TOCTOU DNS rebinding)           │
                        │   • Boilerplate tag & script stripping (<nav>, <footer>, etc) │
                        │   • Text chunk normalization & content-hash deduplication     │
                        └───────────────────────────────┬───────────────────────────────┘
                                                        │
                                                        ▼
                        ┌───────────────────────────────────────────────────────────────┐
                        │               LangChain LCEL Synthesis Engine                 │
                        │   • OpenAI / DeepSeek / Ollama via custom Base URL & Model    │
                        │   • Contiguous, gapless [Source 1..N] citations               │
                        │   • Executive summary extraction & structured formatting      │
                        └───────────────────────────────┬───────────────────────────────┘
                                                        │
                                                        ▼
                        ┌───────────────────────────────────────────────────────────────┐
                        │                 Multi-Format Artifact Exporter                │
                        │   ├── report.md   (YAML Frontmatter + Cited Markdown)         │
                        │   ├── report.html (Responsive Standalone UI + Dark/Light Mode)│
                        │   └── report.json (Full Structured Metadata & Source Graph)   │
                        └───────────────────────────────┬───────────────────────────────┘
                                                        │
                                                        ▼
                                   ┌─────────────────────────────────────────┐
                                   │   ~/.autoresearch/ Local Library        │
                                   │   • autoresearch list                   │
                                   │   • autoresearch view <id|slug> --open  │
                                   └─────────────────────────────────────────┘
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or higher (`v20+` recommended)
- **LLM API Key**: OpenAI, or any OpenAI-compatible provider (Ollama, DeepSeek, etc.)
- **Search Key (Optional)**: [Serper API](https://serper.dev/) (If omitted, AutoResearch automatically uses zero-config DuckDuckGo search)

### 2. Installation

```bash
# Clone the repository
git clone https://github.com/shenald-dev/autoresearch-agent.git
cd autoresearch-agent

# Install dependencies and build
npm install
npm run build

# Link globally for direct shell access
npm link
```

---

## 🔐 Multi-Provider Configuration

Configure credentials interactively through the wizard or directly in `.env`:

### Interactive Wizard (Recommended)
```bash
autoresearch auth
```
The wizard guides you through:
- **OpenAI API Key** (Required for LLM synthesis)
- **Custom Base URL** (Optional: e.g., `http://localhost:11434/v1` for Ollama, or `https://api.deepseek.com/v1`)
- **Model Name** (Optional: e.g., `gpt-4o`, `deepseek-chat`, `llama3.1`, or default `gpt-4-turbo-preview`)
- **Serper API Key** (Optional: leave blank for zero-config DuckDuckGo search)

Credentials are saved securely to `~/.autoresearch/config.json` with restricted `0600` permissions.

### Environment Variables
Alternatively, populate `.env` in the project root:
```env
OPENAI_API_KEY=sk-...
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o
SERPER_API_KEY=your_serper_key_here
```

---

## 💻 CLI Usage & Commands

### 1. `autoresearch research`
Execute autonomous deep research on any query.

```bash
# Interactive mode (prompts for topic, depth, and formats)
autoresearch research

# Automated one-liner with depth 4 and all export formats
autoresearch research -t "Post-Quantum Cryptography Algorithms in 2026" -d 4

# Target custom output directory and export HTML only
autoresearch research -t "Distributed Consensus: Raft vs Paxos" -d 3 -o ./my-reports -f html

# Output purely to terminal stdout without writing files to disk
autoresearch research -t "Rust vs Go Concurrency Models" --no-save
```

#### Research Flags:
| Flag | Description | Default |
| :--- | :--- | :--- |
| `-t, --topic <string>` | The topic to research (1–200 characters) | Interactive prompt |
| `-d, --depth <number>` | Research depth scale from `1` (Overview) to `5` (Comprehensive) | `3` |
| `-o, --output <dir>` | Directory to write generated report folders | `./reports` |
| `-f, --format <format>`| Formats to emit: `all`, `markdown`, `html`, `json` | `all` |
| `--no-save` | Print report to terminal only; bypass file creation | `false` |

---

### 2. `autoresearch list`
View your local research library history.

```bash
autoresearch list
autoresearch list --limit 10
```

Sample output:
```text
📚 Research Library (Last 3 runs):

  • [rep_mm2k3x_a1b2] Post-Quantum Cryptography in 2026
    Depth: 4 | Sources: 8 | Created: 3/31/2026, 4:15 PM
    Artifacts:
      - Markdown: reports/post-quantum-cryptography-in-2026/report.md
      - HTML: reports/post-quantum-cryptography-in-2026/report.html
      - JSON: reports/post-quantum-cryptography-in-2026/report.json

  • [rep_mm2k1y_c3d4] Distributed Consensus: Raft vs Paxos
    Depth: 3 | Sources: 6 | Created: 3/31/2026, 2:30 PM
```

---

### 3. `autoresearch view`
Inspect metadata or directly launch past research reports in your default web browser.

```bash
# View report summary in the terminal
autoresearch view rep_mm2k3x_a1b2

# Look up by topic slug
autoresearch view post-quantum-cryptography-in-2026

# Automatically open the interactive HTML report in your browser
autoresearch view rep_mm2k3x_a1b2 --open
```

---

### 4. `autoresearch auth`
Update API keys, custom endpoints, or model selections at any time:
```bash
autoresearch auth
```

---

## 📁 Multi-Format Report Artifacts

Every completed session creates a organized directory under `./reports/<slug>/`:

```text
reports/
└── post-quantum-cryptography-in-2026-mm2k3x/
    ├── report.md    # Formatted Markdown with YAML frontmatter & bibliography
    ├── report.html  # Standalone interactive UI with dark/light themes & print CSS
    └── report.json  # Complete structured metadata, sub-queries & source URLs
```

### Standalone HTML Report Highlights:
- **Clean Aesthetic**: Built with clean typography, responsive fluid layout, and CSS custom properties.
- **Dark & Light Mode**: Automatic system preference detection (`prefers-color-scheme`) with smooth color transitions.
- **Source Verification Cards**: Visual grid of verified external sources with original titles, URLs, and snippet excerpts.
- **Print & PDF Ready**: Embedded `@media print` rules strip headers, footers, and shadows for clean PDF printing.

---

## 🛡️ Enterprise Security & Hardening

1. **Anti-SSRF Protection**: Hostnames are resolved to IP addresses prior to dispatch. All IP addresses are checked using `ipaddr.js` against private ranges:
   - Loopback (`127.0.0.0/8`, `::1`)
   - RFC 1918 Private subnets (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`)
   - Link-local and Carrier-Grade NAT (`169.254.0.0/16`, `100.64.0.0/10`)
   - Cloud metadata endpoints (`169.254.169.254`)
2. **DNS Rebinding Prevention**: Validated IP addresses are pinned directly to socket connection options via a custom `undici.Agent`, preventing Time-of-Check to Time-of-Use (TOCTOU) DNS rebinding attacks.
3. **Memory & Payload Guardrails**: Incoming streams are capped at 500KB per document. If a source exceeds the limit, the connection is safely canceled to protect system memory.
4. **Secure Key Permissions**: Configuration files written to `~/.autoresearch/config.json` use strict POSIX `0600` mode (read/write by owner only).

---

## 🧪 Development & Verification

The codebase maintains strict code quality standards, 100% type safety, and an automated test suite with **82 unit and integration tests**:

```bash
# Run full Vitest test suite
npm test

# Run code style and lint checks with Biome
npm run lint

# Auto-format and organize imports
npm run format

# Compile TypeScript
npm run build

# Start live file watcher for rapid iteration
npm run dev
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are warmly welcome!
Please review our [Contributing Guide](CONTRIBUTING.md) for architecture overviews, local development workflows, security guardrails, and commit conventions. All pull requests must pass our automated verification suite (`npm test`, `npm run lint`, `npm run build`).

---

## 📄 License

This project is licensed under the [GNU General Public License v3.0 (GPL-3.0-or-later)](LICENSE) © 2026 [shenald-dev](https://github.com/shenald-dev).
