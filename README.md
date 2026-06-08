# README.md
<div align="center">
  <img src="assets/enterprise-logo.png" alt="AutoResearch Agent Logo" width="250" />

  <h1>✨ AutoResearch Agent</h1>
  <p><b>Modular AI Research Agent</b></p>
  <i>An enterprise-grade, modular AI research agent built for high-performance content generation.</i>
  
  <br/>

  [![TypeScript](https://badgen.net/badge/icon/typescript?icon=typescript&label)](https://typescriptlang.org)
  [![LangChain](https://img.shields.io/badge/LangChain-AI-orange.svg)](https://langchain.com)
  [![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## 📑 Table of Contents
- [🌟 Overview](#-overview)
- [🚀 Enterprise Features](#-enterprise-features)
- [🗺️ System Architecture](#️-system-architecture)
- [⚡ Quick Start Guide](#-quick-start-guide)
- [💻 Comprehensive Usage](#-comprehensive-usage)
- [🤝 Contributing](#-contributing)

---

## 🌟 Overview

The **AutoResearch Agent** is an intelligent, high-performance CLI tool powered by LangChain and LLMs. It acts as an autonomous digital researcher that browses the internet, synthesizes data, cross-references sources, and generates deep-dive, impeccably formatted markdown reports on any given topic.

Say goodbye to having 50 browser tabs open. Let the agent do the heavy lifting while you focus on the insights.

---

## 🚀 Enterprise Features

- **🧠 Modular Architecture**: Built with a plug-and-play architecture supporting drop-in memory, custom tools, and varied output formatters.
- **⚡ Type-Safe & Robust**: Engineered entirely in TypeScript with strict schema validation via `zod` to prevent LLM hallucinations.
- **🔗 LangChain Core**: Powered by robust LCEL (LangChain Expression Language) pipelines for complex reasoning chains.
- **🕸️ Autonomous Web Browsing**: Natively hooks into search APIs to dynamically browse and scrape the web for the latest information.
- **🌊 Zero Bloat**: Lightning-fast developer loop via `tsx` and `Biome`, ensuring maximal performance.
- **📝 Automatic Markdown Compilation**: Synthesizes the raw data into gorgeous, structured markdown files instantly.

---

## 🗺️ System Architecture

The agent follows an iterative "Plan-and-Solve" pattern, dynamically deciding which tools to call based on the complexity of the research topic.
---

## ⚡ Quick Start Guide

### 1. Prerequisites
Ensure you have Node.js 18+ and an API key for your preferred LLM (e.g., OpenAI, Anthropic).

### 2. Installation
Clone the repository and install the lightning-fast dependencies:
### 3. Environment Configuration
Copy the example environment file and add your API keys:
Edit the `.env` file to include your LLM provider keys (e.g., `OPENAI_API_KEY`, `ANTHROPIC_API_KEY`) and any search API keys required for web browsing.
### 4. Run the Agent
Start researching with a single command:
---

## 💻 Comprehensive Usage

The AutoResearch Agent provides several CLI options to fine-tune your research workflow. The primary entry point is `src/cli/index.ts`.

| Flag | Description | Default |
|------|-------------|---------|
| `-t, --topic <string>` | The main research topic or query (Required) | - |
| `-d, --depth <level>` | Research depth: `shallow`, `standard`, or `deep` | `standard` |
| `-m, --model <model>` | LLM model to use (e.g., `gpt-4o`, `claude-3-opus`) | `gpt-4o` |
| `-o, --output <dir>` | Output directory for generated markdown reports | `./reports` |
| `--max-iterations <num>`| Maximum number of reasoning iterations before forcing a conclusion | `10` |
| `--no-browser` | Disable autonomous web browsing (use only local context/memory) | `false` |
| `-v, --verbose` | Enable verbose debug logging for the LCEL pipeline | `false` |
| `-h, --help` | Display help information and exit | - |

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
