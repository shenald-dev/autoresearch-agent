<<<<<<< HEAD
﻿# Contributing to AutoResearch Agent 🚀

Thanks for considering contributing! This project follows **vibe coder** principles: keep it simple, solve real problems, no bureaucracy.

---

## 🎯 How to Help

- 🐛 **Bug reports** — Open an issue with steps to reproduce
- 💡 **Feature ideas** — Open an issue to discuss before PR
- 🔧 **Pull requests** — Small, focused changes only
- 📝 **Documentation** — Fix typos, improve examples

---

## 🛠️ Development Setup

```bash
git clone https://github.com/shenald-dev/autoresearch-agent.git
cd autoresearch-agent
npm install
cp .env.example .env  # Add your API keys
npm run dev -- -t "Your Research Topic"
=======
﻿# Contributing to autoresearch-agent

Hey! Thanks for considering contributing. This project is built with **vibe coder** principles: keep it simple, solve real problems, no bureaucracy.

---

## ðŸŽ¯ How to Help

- **Bug reports** â€” Open an issue with steps to reproduce
- **Feature ideas** â€” Open an issue to discuss before PR
- **Pull requests** â€” Small, focused changes only
- **Documentation** â€” Fix typos, improve examples

---

## ðŸ› ï¸ Development Setup

```bash
git clone https://github.com/your-username/autoresearch-agent.git
cd autoresearch-agent
npm install
npm link  # optional, for global CLI testing
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))
```

---

<<<<<<< HEAD
## 📐 Code Style

- TypeScript strict mode enabled
- Use 4 spaces for indentation
- Semicolons required
- Keep functions small (<50 LOC)
- No `console.log` in production code (use chalk-wrapped logging)
=======
## ðŸ“ Code Style

- Use 2 spaces for indentation
- Semicolons? Yes.
- Keep functions small (< 50 LOC)
- No debug `console.log` in production code
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))
- Write tests for new features

---

<<<<<<< HEAD
## ✅ Before Submitting PR

- [ ] Tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
=======
## âœ… Before Submitting PR

- [ ] Tests pass (`npm test`)
- [ ] No lint errors (if configured)
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))
- [ ] README updated if needed
- [ ] Commit message follows conventional commits (`feat:`, `fix:`, etc.)
- [ ] One change per PR (no mega PRs)

---

<<<<<<< HEAD
## 🏗️ Architecture

The project follows a modular agent pipeline:

```
ResearchAgent → SummarizerAgent → ContentGenerator → PublisherAgent
```

Each agent is in `src/agents/` and tools are in `src/tools/`. To add a new agent:

1. Create `src/agents/MyAgent.ts` with an `execute()` method
2. Import and wire it in `src/core/engine.ts`
3. Add tests in `tests/`

---

## 📦 Releasing

```bash
# Update version in package.json
git commit -m "chore: release v2.0.1"
git tag -a v2.0.1 -m "Release v2.0.1"
git push origin v2.0.1
gh release create v2.0.1 --title "v2.0.1" --notes "Description"
=======
## ðŸ“¦ Releasing

Only maintainers (currently just the author) create releases:

```bash
# Update version in package.json
# Commit with "chore: release v0.1.1"
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
gh release create v0.1.1 --title "v0.1.1" --notes "Brief description"
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))
```

---

<<<<<<< HEAD
## 💬 Code of Conduct
=======
## ðŸ’¬ Code of Conduct
>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))

Be nice. No jerks. That's it.

---

<<<<<<< HEAD
**Happy contributing!** ✨
=======
**Happy contributing!** ðŸš€

>>>>>>> e1d6a9b (perf(engine): optimize context string buffering (#32))
