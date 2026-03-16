## 2024-05-17 — Lazy Loading Heavy CLI Dependencies

Learning:
For CLI applications (like Commander), importing heavy libraries (e.g., Langchain, OpenAI clients) at the top of the file significantly delays boot time for basic commands like `--help` or `--version`.

Action:
Dynamically import heavy dependencies inside the `.action` handler to defer their initialization until they are actually needed.
