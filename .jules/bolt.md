ed text. Semantic structural tags like `<header>` and `<aside>` should be preserved as they frequently contain essential content.

Action:
Expanded the HTML stripping regex in `WebFetcher` to safely remove complete and unclosed boilerplate tags without touching semantic tags to save LLM context window tokens and improve API efficiency.