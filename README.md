<div align="center">
  <img src="assets/logo.png" alt="AutoResearch Agent Logo" width="220" />

  <h1>✨ AutoResearch Agent</h1>
  <p><b>Autonomous Deep-Dive Research & Markdown Synthesis CLI</b></p>
  <i>Search the web, extract verified content concurrently with enterprise-grade SSRF protection, and generate comprehensive, cited research reports in seconds.</i>

  <br/><br/>

  [![CI](https://github.com/shenald-dev/autoresearch-agent/actions/workflows/ci.yml/badge.svg)](https://github.com/shenald-dev/autoresearch-agent/actions/workflows/ci.yml)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg?logo=typescript)](https://www.typescriptlang.org/)
  [![LangChain](https://img.shields.io/badge/LangChain-LCEL-orange.svg)](https://langchain.com)
  [![Vitest](https://img.shields.io/badge/Tested%20with-Vitest-729B1B.svg?logo=vitest)](https://vitest.dev/)
  [![Biome](https://img.shields.io/badge/Code%20Style-Biome-60a5fa.svg?logo=biome)](https://biomejs.dev/)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 📑 Table of Contents
- [🌟 Overview](#-overview)
- [🚀 Key Features](#-key-features)
- [🗺️ System Architecture](#️-system-architecture)
- [⚡ Quick Start Guide](#-quick-start-guide)
- [🔐 Configuration](#-configuration)
- [💻 CLI Usage](#-cli-usage)
- [🧪 Development & Testing](#-development--testing)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## 🌟 Overview

**AutoResearch Agent** is an autonomous CLI research assistant built with TypeScript, LangChain, and modern Node.js. It eliminates the manual friction of opening dozens of browser tabs, reading through cluttered web pages, and taking fragmented notes.

Given any research topic, the agent:
1. Queries real-time search engines via Serper API with exponential backoff.
2. Discovers and deduplicates relevant URLs across the web.
3. Fetches and sanitizes source documents concurrently using an SSRF-hardened HTTP client.
4. Cleans boilerplate HTML, comments, and scripts to extract high-signal textual context.
5. Synthesizes a structured, executive-ready Markdown report with contiguous, verified citations.

---

## 🚀 Key Features

- **🧠 Autonomous LCEL Pipeline**: Powered by LangChain Expression Language (LCEL) chains for deterministic, structured report synthesis.
- **🛡️ Enterprise SSRF & DNS-Rebinding Hardening**: Custom `undici.Agent` dispatcher pre-resolves hostnames, validates strict public unicast IP ranges with `ipaddr.js`, and binds sockets directly to verified IPs to prevent TOCTOU DNS rebinding attacks.
- **⚡ Bounded Concurrent Scraping**: Multi-threaded async batch fetching managed via `p-limit` with early payload size limits (500KB cap) to prevent out-of-memory overhead.
- **🧹 Preemptive Context Sanitization**: Strips HTML comments, unclosed tags, and boilerplate containers (`<script>`, `<style>`, `<nav>`, `<footer>`, `<svg>`, `<iframe>`, `<noscript>`) while preserving core semantic content.
- **🎯 Contiguous Source Citations**: Validated sources are indexed sequentially (`[Source 1]`, `[Source 2]`, etc.) without numbering gaps, ensuring clean, verifiable references in the final document.
- **🔐 Secure Credential Management**: Encrypted storage for API keys at `~/.autoresearch/config.json` with restricted `0600` POSIX permissions, with automatic fallback to environment variables.
- **🎨 Interactive Terminal Experience**: Beautiful terminal UI built with `@clack/prompts` and spinners, alongside support for headless scripting and CI/CD automation.

---

## 🗺️ System Architecture

```text
┌─────────────────────────────────────────────────────────────────┐
│                    User CLI Prompt / Flags                      │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│              Phase 1: Google Searcher (Serper API)              │
│       • Query optimization & exponential backoff retries        │
│       • Deduplication of candidate URLs by canonical host       │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│            Phase 2: Hardened Web Fetcher (Undici)               │
│       • DNS lookup & strict public IP validation (ipaddr.js)    │
│       • Custom Undici Agent pinning (DNS Rebinding protection)  │
│       • Streaming decode & boilerplate HTML stripping           │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│          Phase 3: Context Assembler & LCEL Synthesis            │
│       • Deduplication of identical content across domains       │
│       • Contiguous [Source 1..N] reference indexing             │
│       • LangChain ChatOpenAI prompt pipeline execution          │
└────────────────────────────────┬────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────┐
│             Structured Executive Markdown Report                │
└─────────────────────────────────────────────────────────────────┘
```

---

## ⚡ Quick Start Guide

### 1. Prerequisites
- **Node.js**: `v18.0.0` or later (Node.js 20+ recommended)
- **API Keys**:
  - [OpenAI API Key](https://platform.openai.com/api-keys) (for LLM synthesis)
  - [Serper API Key](https://serper.dev/) (for real-time Google search indexing)

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/shenald-dev/autoresearch-agent.git
cd autoresearch-agent
npm install
npm run build
```

Link globally if you want `autoresearch` accessible directly in your shell:

```bash
npm link
```

---

## 🔐 Configuration

You can configure your API credentials using the built-in interactive wizard or via environment variables.

### Option A: Interactive Setup (Recommended)

Run the authentication wizard to securely store keys in `~/.autoresearch/config.json`:

```bash
npm start -- auth
# or if linked globally:
autoresearch auth
```

### Option B: Environment Variables

Alternatively, create a `.env` file in the project root:

```bash
cp .env.example .env
```

Set your keys inside `.env`:

```env
OPENAI_API_KEY=sk-proj-...
SERPER_API_KEY=your_serper_api_key_here
OPENAI_MODEL=gpt-4-turbo-preview
```

---

## 💻 CLI Usage

### Interactive Mode

Simply start the research command without flags to launch the step-by-step interactive prompt:

```bash
npm start -- research
```

You will be guided through:
1. Entering your research topic.
2. Selecting research depth (from `1 - Quick Overview` to `5 - Deep Dive`).

### Headless / Automated Mode

Provide flags directly for scripted workflows or terminal one-liners:

```bash
npm start -- research -t "Post-Quantum Cryptography in 2026" -d 3
```

#### Available CLI Commands & Options

```text
Usage: autoresearch [command] [options]

Enterprise AI Autonomous Research framework

Commands:
  auth                            Set your OpenAI and Serper API keys securely
  research [options]              Run an autonomous deep-dive research on a topic

Options:
  -v, --version                   Output the current version
  -h, --help                      Display help for command

Research Options:
  -t, --topic <string>            The topic to research (1-200 characters)
  -d, --depth <number>            Research depth from 1 (Surface) to 5 (Deep Analysis)
```

---

## 🧪 Development & Testing

This project uses [Vitest](https://vitest.dev/) for unit and integration testing, and [Biome](https://biomejs.dev/) for ultra-fast linting and formatting.

```bash
# Run unit & integration tests
npm test

# Check code formatting & linting
npm run lint

# Automatically format code with Biome
npm run format

# Compile TypeScript to dist/
npm run build

# Run in development mode with live watch
npm run dev
```

---

## 🤝 Contributing

Contributions, feedback, and pull requests are welcome!
Please review [CONTRIBUTING.md](CONTRIBUTING.md) for details on code style, testing guidelines, and commit standards.

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) © 2026 [shenald-dev](https://github.com/shenald-dev).
