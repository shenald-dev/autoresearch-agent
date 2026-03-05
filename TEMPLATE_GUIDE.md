# ðŸš€ 1-Day Project Template â€” Usage Guide

This template is designed for **rapid publishing**: from idea to GitHub release in < 5 hours.

---

## ðŸ“‹ Quick Start

1. **Copy the template**
   ```bash
   cp -r templates/project-template projects/your-new-project
   ```

2. **Replace placeholders** (all files):
   - `autoresearch-agent` â†’ Your project name (e.g., `moq`)
   - `autoresearch-agent` â†’ npm package name (e.g., `moq`)
   - `AI research assistant that writes for you.` â†’ One-line pitch (e.g., `HTTP mocks at the speed of thought`)
   - `AI autonomous research system: takes a topic, researches, summarizes, and generates blog articles, tweet threads, and video scripts.` â†’ Short description (1-2 sentences)
   - `Why? Because it solves a real problem. 

This tool makes it easy to: autonomous research-to-content pipeline.` â†’ Why this tool exists (problem + solution)
   - `3001` â†’ Default port (e.g., `3000`)
   - `/health` â†’ Example API path (e.g., `/api/users`)
   - `autonomous research-to-content pipeline` â†’ Main feature (e.g., `zero-config HTTP mocking`)

3. **Implement your feature** in `src/index.js`:
   - Add routes
   - Add business logic
   - Keep it simple (< 300 LOC)

4. **Test locally**
   ```bash
   npm install
   npm test
   npm start
   ```

5. **Publish**
   ```bash
   git init
   git add -A
   git commit -m "feat: initial release"
   gh repo create your-username/autoresearch-agent --public --source . --push
   git tag -a v0.1.0 -m "Release v0.1.0"
   git push origin v0.1.0
   gh release create v0.1.0 --title "v0.1.0" --notes "Initial release"
   ```

---

## â±ï¸ 1-Day Schedule

| Time | Task |
|------|------|
| 0-1h | Copy template, replace placeholders, implement core logic |
| 1-2h | Write tests (use template), fix bugs, manual testing |
| 2-3h | README polish, add examples, Dockerfile (optional) |
| 3-4h | GitHub setup, push, tag, create release |
| 4-5h | Share, celebrate ðŸŽ‰ |

---

## âœ… Checklist Before Publish

- [ ] All placeholders replaced
- [ ] `npm test` passes (3 tests minimum: health, happy path, 404)
- [ ] `npm start` runs without errors
- [ ] README has: install, quick start, usage examples
- [ ] LICENSE file present (MIT)
- [ ] `.gitignore` excludes `node_modules/`, `.env`, logs
- [ ] No console.log debug prints in production code
- [ ] GitHub repo created (public)
- [ ] Tag `v0.1.0` pushed
- [ ] Release notes published

---

## ðŸ“¦ What You Get

- Express server with health check
- CLI with yargs (port flag)
- Basic test suite (forked server, HTTP requests)
- Dockerfile (multi-stage build)
- Makefile (test, build, docker-build)
- Vibe-coder README template
- CHANGELOG.md
- MIT license

---

## ðŸŽ¯ Philosophy

- **Zero bloat** â€” Only what you need
- **Test fast** â€” 3 tests, that's it
- **Publish faster** â€” Tag v0.1.0 same day
- **Iterate** â€” Next version can add features

---

**Ready? Build something useful.** ðŸš€

