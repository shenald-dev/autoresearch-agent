# Contributing to autoresearch-agent

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
```

---

## ðŸ“ Code Style

- Use 2 spaces for indentation
- Semicolons? Yes.
- Keep functions small (< 50 LOC)
- No debug `console.log` in production code
- Write tests for new features

---

## âœ… Before Submitting PR

- [ ] Tests pass (`npm test`)
- [ ] No lint errors (if configured)
- [ ] README updated if needed
- [ ] Commit message follows conventional commits (`feat:`, `fix:`, etc.)
- [ ] One change per PR (no mega PRs)

---

## ðŸ“¦ Releasing

Only maintainers (currently just the author) create releases:

```bash
# Update version in package.json
# Commit with "chore: release v0.1.1"
git tag -a v0.1.1 -m "Release v0.1.1"
git push origin v0.1.1
gh release create v0.1.1 --title "v0.1.1" --notes "Brief description"
```

---

## ðŸ’¬ Code of Conduct

Be nice. No jerks. That's it.

---

**Happy contributing!** ðŸš€

