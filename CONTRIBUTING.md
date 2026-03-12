# Contributing to AutoResearch Agent 🚀

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
```

---

## 📐 Code Style

- TypeScript strict mode enabled
- Use 4 spaces for indentation
- Semicolons required
- Keep functions small (<50 LOC)
- No `console.log` in production code (use chalk-wrapped logging)
- Write tests for new features

---

## ✅ Before Submitting PR

- [ ] Tests pass (`npm test`)
- [ ] No lint errors (`npm run lint`)
- [ ] README updated if needed
- [ ] Commit message follows conventional commits (`feat:`, `fix:`, etc.)
- [ ] One change per PR (no mega PRs)

---

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
```

---

## 💬 Code of Conduct

Be nice. No jerks. That's it.

---

**Happy contributing!** ✨
