## 2024-05-23 — CLI Startup Time Optimization with Lazy Loading

Learning:
Heavy imports (like `@langchain/openai` and `@langchain/core`) at the top level of a CLI file significantly slow down the startup time of all commands, including simple ones like `--help` or `--version`.

Action:
Use dynamic imports (`await import(...)`) for heavy modules inside the specific command action where they are actually needed. This avoids loading the modules when they aren't used, making the CLI much faster.

## 2024-05-18 — Add robust input validation with Zod

Learning:
Using explicit schemas (like Zod) protects the underlying application from unexpected CLI inputs, enhancing security and preventing crashes from bad data.

Action:
Ensure input bounds and types are validated before passing them into the engine layer.
