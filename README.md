# autoresearch-agent

> **AI research assistant that writes for you.**

AI autonomous research system: takes a topic, researches, summarizes, and generates blog articles, tweet threads, and video scripts.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen.svg)](https://nodejs.org)

---

## âœ¨ Why?

Why? Because it solves a real problem. 

This tool makes it easy to: autonomous research-to-content pipeline.

---

## ðŸš€ Quick Start

```bash
# 1ï¸âƒ£ Install dependencies
npm install

# 2ï¸âƒ£ Try the example
npm start
# Then open: http://localhost:3001//health

# 3ï¸âƒ£ Run tests
npm test

# 4ï¸âƒ£ Try the CLI
node bin/cli.js /health
```

That's it. You're up and running.

---

## ðŸ“¦ Install Options

### **Global (CLI tool)**
```bash
npm link  # installs autoresearch-agent globally
autoresearch-agent --help
```

### **Docker**
```bash
docker build -t autoresearch-agent:0.1.0 .
docker run -p 3001:3001 autoresearch-agent:0.1.0
```

### **From source**
```bash
git clone https://github.com/your-username/autoresearch-agent.git
cd autoresearch-agent
npm install
npm link  # optional, for global CLI
```

---

## ðŸ§© Usage

### **As a library**
```js
const {{ClassName}} = require('autoresearch-agent');
const app = new {{ClassName}}({ port: 3001 });
app.start();
```

### **As a CLI**
```bash
# Basic usage
autoresearch-agent --port 3001

# With configuration file
autoresearch-agent --config ./config.json

# Help
autoresearch-agent --help
```

---

## ðŸ“ Configuration

Optional `config.json`:

```json
{
  "port": 3001,
  "logLevel": "info",
  "enableMetrics": false
}
```

---

## ðŸ› ï¸ Development

```bash
# Install deps
npm install

# Run with hot reload (requires nodemon)
npm run dev

# Run tests
npm test

# Lint (if configured)
npm run lint

# Build (if needed)
npm run build

# Create a release
git tag -a v0.1.0 -m "Release v0.1.0"
git push origin v0.1.0
gh release create v0.1.0 --title "v0.1.0" --notes "Initial release"
```

---

## ðŸ“œ License

MIT â€” do whatever you want.

---

## ðŸ™‹â€â™‚ï¸ Built by a vibe coder, for vibe coders.

If it's useful, star it â­ â€” if not, open an issue and tell me why.

*Less is more.* ðŸ§˜

