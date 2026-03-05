# AutoResearch Agent

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)
[![CI](https://github.com/shenald-dev/autoresearch-agent/workflows/CI/badge.svg)](https://github.com/shenald-dev/autoresearch-agent/actions)

> **AI autonomous research system.** Give it a topic, get a blog article, tweet thread, and video script — automatically.

---

## ✨ What?

AutoResearch Agent takes a topic, searches the web, scrapes content, summarizes with an LLM, and generates multiple content formats:

- 📝 **Blog article** (Markdown, with headings, bullet points)
- 🐦 **Tweet thread** (5-7 tweets, numbered)
- 🎬 **Video script** (60-second short with scene descriptions)
- 📊 **Raw research** (JSON of all sources and scraped text)

All saved to `outputs/` automatically. Optional auto-posting to Twitter/LinkedIn (disabled by default).

---

## 🚀 Quick Start

### **1. Clone & Install**

```bash
git clone https://github.com/shenald-dev/autoresearch-agent.git
cd autoresearch-agent
npm install
```

### **2. Configure Environment**

```bash
cp .env.example .env
# Edit .env and add:
# - OPENAI_API_KEY (required)
# - SERPAPI_KEY (required for web search)
```

Get keys:
- OpenAI: https://platform.openai.com/api-keys
- SerpAPI: https://serpapi.com/ (free tier available)

### **3. Run**

```bash
# Dry run to check config
node bin/cli.js "AI trends 2024" --dry-run

# Actually run
node bin/cli.js "AI trends 2024"

# Outputs will be in outputs/markdown/ and outputs/json/
cat outputs/markdown/blog-*.md
```

---

## 📦 Install Options

### **Global (CLI)**

```bash
npm link
autoresearch "AI trends 2024"
```

### **Docker**

```bash
# Build image
make docker-build

# Run (with env vars in .env)
docker-compose run --rm agent "AI trends 2024"

# Or manually:
docker run -e OPENAI_API_KEY=xxx -e SERPAPI_KEY=xxx autoresearch-agent:0.1.0 "AI trends 2024"
```

---

## 🧩 Usage

### **CLI**

```bash
# Basic
autoresearch "quantum computing breakthroughs"

# Custom max search results
autoresearch "rust vs go" --max-results 20

# Disable auto-posting
autoresearch "node.js performance" --no-publish

# Specify output directory
autoresearch "web assembly" --output ./my-results
```

### **As Library**

```js
const { Orchestrator } = require('autoresearch-agent/core/orchestrator');
const cfg = require('./config');

const orch = new Orchestrator(cfg);
const result = await orch.run('AI trends 2024');

console.log('Blog:', result.content.blog);
fs.writeFileSync('my-blog.md', result.content.blog);
```

---

## 📁 Output Structure

```
outputs/
├── markdown/
│   ├── blog-<topic>-<timestamp>.md
│   ├── tweets-<topic>-<timestamp>.md
│   └── video-<topic>-<timestamp>.md
└── json/
    ├── blog-<topic>-<timestamp>.json
    ├── tweets-<topic>-<timestamp>.json
    ├── video-<topic>-<timestamp>.json
    └── full-<topic>-<timestamp>.json   # full research data (sources, scraped text)
```

---

## 🔧 Configuration

`.env` variables:

| Variable | Required? | Description |
|----------|-----------|-------------|
| `OPENAI_API_KEY` | ✅ Yes | OpenAI API key |
| `SERPAPI_KEY` | ✅ Yes (or set `ENABLE_SEARCH=false`) | SerpAPI key for Google search |
| `OPENAI_MODEL` | No | Model to use (default: `gpt-4-turbo-preview`) |
| `OPENAI_MAX_TOKENS` | No | Max tokens per LLM call (default: 2000) |
| `MAX_SEARCH_RESULTS` | No | Number of search results to scrape (default: 10) |
| `SUMMARY_LENGTH` | No | Target summary word count (default: 500) |
| `ENABLE_PUBLISHING` | No | Enable auto-post to social media (default: `false`) |
| `LOG_LEVEL` | No | Logging level (default: `info`) |

---

## 🏗️ Architecture

See [ARCHITECTURE.md](ARCHITECTURE.md) for detailed diagram and component explanations.

**High-level flow:**

```
User Input (topic)
    ↓
ResearchAgent → web_search + web_scrape → [sources]
    ↓
SummarizerAgent → LLM → [summary]
    ↓
ContentGeneratorAgent → LLM → {blog, tweets, video}
    ↓
PublisherAgent → write files (+ optional social post)
```

All agents are independent, testable, and replaceable.

---

## 🧪 Development

```bash
# Install dependencies
make install

# Run tests
make test
# or: npm run test:unit && npm run test:integration

# Lint
make lint

# Run directly
node bin/cli.js "test topic"

# Dry run (validate config only)
node bin/cli.js "test topic" --dry-run
```

---

## 🐳 Docker

```bash
# Build
make docker-build

# Run
make docker-run   # uses docker-compose

# Or one-off:
docker-compose run --rm agent "your topic here"
```

---

## 📊 Example Output

**Blog (Markdown):**

```markdown
# AI Trends in 2024

## Introduction
Artificial Intelligence continues to evolve at a breakneck pace...

## Key Trends
1. **Multimodal AI** — models that understand text, images, audio...
2. **Small Language Models** — efficient models for edge devices...
3. **AI Agents** — autonomous systems that perform tasks...

## Conclusion
The AI landscape in 2024 is more accessible than ever...
```

**Tweet Thread:**

```
1/7 AI in 2024 is wild. Here's what's actually happening 🧵 👇

2/7 Multimodal AI is now mainstream. GPT-4V, Claude 3, Gemini...
   They don't just read text — they see, hear, and reason.

3/7 Small Language Models (SLMs) are taking over.
   Why? Cost, speed, privacy. You can run Llama 3 8B on a laptop...

[... more tweets ...]

7/7 Bottom line: AI is becoming invisible. Embedded in everything.
   The future is not about "using AI" — it's just using software.
   Follow for more tech insights.
```

---

## 🚀 Roadmap

- [ ] Add more search providers (Bing, Brave)
- [ ] Support for additional output formats (LinkedIn article, Substack)
- [ ] Web UI (React frontend)
- [ ] Scheduled publishing queue
- [ ] Content quality scoring
- [ ] Human-in-the-loop review step
- [ ] Pluggable LLM backends (Claude, open-source models)
- [ ] Batch processing (multiple topics)

---

## 📜 License

MIT — see [LICENSE](LICENSE) file.

---

## 🙋‍♂️ Built by a vibe coder, for vibe coders.

If it's useful, star it ⭐ — if not, open an issue and tell me why.

*Less is more.* 🧘
