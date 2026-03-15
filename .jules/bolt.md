## 2024-05-23 — CLI Startup Time Optimization with Lazy Loading

Learning:
Heavy imports (like `@langchain/openai` and `@langchain/core`) at the top level of a CLI file significantly slow down the startup time of all commands, including simple ones like `--help` or `--version`.

Action:
Use dynamic imports (`await import(...)`) for heavy modules inside the specific command action where they are actually needed. This avoids loading the modules when they aren't used, making the CLI much faster.
