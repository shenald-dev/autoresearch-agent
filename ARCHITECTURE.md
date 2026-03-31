# Architecture — AutoResearch Agent

## Overview

AutoResearch Agent is a modular, agent-based system for autonomous research and content generation. It follows a **pipeline architecture** where each agent has a single responsibility.

---

## System Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     User Interface                          │
│  • CLI (bin/cli.js)  • Web UI (future)                     │
└───────────────────────────┬─────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                  Orchestrator (core)                        │
│  • Loads config  • Coordinates agents  • Error handling    │
└───────┬──────────────┬──────────────┬──────────────┬───────┘
        │              │              │              │
        ▼              ▼              ▼              ▼
┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ Research    │ │ Summarizer  │ │ Content     │ │ Publisher   │
│ Agent       │ │ Agent       │ │ Generator   │ │ Agent       │
├─────────────┤ ├─────────────┤ ├─────────────┤ ├─────────────┤
│ • web_search│ │ • LLM       │ │ • LLM       │ │ • file_writer│
│ • web_scrape│ │ • condense  │ │ • blog      │ │ • social_poster│
│             │ │             │ │ • tweets    │ │             │
└─────────────┘ └─────────────┘ │ • video     │ └─────────────┘
        │                        │             │
        └────────────────────────┴─────────────┘
                            │
                            ▼
                    ┌─────────────┐
                    │   Outputs   │
                    │ • markdown/ │
                    │ • json/     │
                    └─────────────┘
```

---

## Components

### **1. Orchestrator** (`core/orchestrator.js`)

- **Role:** Central coordinator
- **Responsibilities:**
  - Load and validate configuration
  - Instantiate agents
  - Execute pipeline in order
  - Handle errors and logging
- **Dependencies:** All agents, config, utils

### **2. Research Agent** (`agents/research_agent.js`)

- **Input:** Topic string
- **Process:**
  1. Call `web_search(topic)` → list of URLs
  2. For each URL: `web_scrape(url)` → text content (Note: concurrent web scraping concurrency is now dynamically bound based on the requested research `depth` configuration parameter).
  3. Collect successful scrapes
- **Output:** `{ topic, sources: [{title, link, content, snippet}], totalSources }`

### **3. Summarizer Agent** (`agents/summarizer_agent.js`)

- **Input:** Research data (multiple source texts)
- **Process:** Call LLM to summarize all content into coherent summary
- **Output:** `{ topic, summary, wordCount, sourceCount, generatedAt }`

### **4. Content Generator Agent** (`agents/content_generator_agent.js`)

- **Input:** Summary + research data (for references)
- **Process:** Call LLM three times to generate:
  - Blog article (Markdown)
  - Tweet thread (5-7 tweets)
  - Video script (60s narration + scene desc)
- **Output:** `{ topic, content: {blog, tweetThread, videoScript} }`

### **5. Publisher Agent** (`agents/publisher_agent.js`)

- **Input:** Content data + summary + research
- **Process:**
  - Write each content type to `outputs/markdown/` and `outputs/json/`
  - If `enablePublishing=true`, attempt social media posts (stub)
- **Output:** `{ files: {...}, posted: {...} }`

### **6. Tools** (`tools/`)

Reusable utilities:

| Tool | Purpose |
|------|---------|
| `web_search.js` | SerpAPI wrapper (or mock fallback) |
| `web_scraper.js` | Fetch URL, extract text with cheerio |
| `llm_client.js` | OpenAI chat completions with summarization & generation methods |
| `file_writer.js` | Write markdown/JSON to outputs with naming convention |
| `social_poster.js` | Post to Twitter/LinkedIn (stubs, requires API keys) |

### **7. UI** (`ui/`)

- **CLI** (`cli.js`): yargs-based command-line interface
- **Web Server** (future): Express app for browser UI

---

## Data Flow

1. User runs `autoresearch "topic"`
2. CLI parses args, loads `.env` config
3. Orchestrator created, validates config
4. `ResearchAgent.execute(topic)` → scrapes web
5. `SummarizerAgent.execute(researchData)` → LLM summary
6. `ContentGeneratorAgent.execute(summaryData, researchData)` → 3 content types
7. `PublisherAgent.execute(contentData, summaryData, researchData)` → saves files
8. Orchestrator returns result object with paths
9. CLI prints success message with file locations

---

## Error Handling

- Each agent catches its own errors and throws descriptive exceptions
- Orchestrator catches any throw and returns `{ success: false, error: ... }`
- Logging via `pino` at `info` level, errors at `error` level
- Failed scrapes are skipped (doesn't stop pipeline)

---

## Extensibility

To add a new agent:

1. Create `agents/my_agent.js` with `execute(input)` method
2. Import in `core/orchestrator.js`
3. Add to pipeline sequence
4. Update type definitions if needed

To add new output formats:

- Extend `PublisherAgent` with new `writeX` method
- Or create a separate agent after content generation

---

## Environment Variables

See `.env.example` and `core/config.js`. All secrets via环境变量 (no hardcoding).

---

## Testing Strategy

- **Unit tests** (`tests/unit/`): Test each tool/agent in isolation with mocks
- **Integration tests** (`tests/integration/`): Test full pipeline with minimal topic and mocked LLM/search
- **Dry-run mode**: `--dry-run` validates config without spending API credits

---

## Deployment

- **Local:** `npm link` installs global `autoresearch` command
- **Docker:** `docker-compose run --rm agent "topic"` (mount `.env` and `outputs/`)
- **CI/CD:** GitHub Actions can run scheduled research (optional)

---

*Built with intention.* 🧘
