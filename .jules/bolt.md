## 2024-05-18 — Strict SSRF IP Validation

Learning:
Basic string prefix matching (e.g., `hostname.startsWith("10.")`) for Server-Side Request Forgery (SSRF) validation is fundamentally flawed as it incorrectly blocks valid, externally resolvable domains (e.g., `10.example.com`). Additionally, cloud metadata endpoints (`169.254.x.x`) and the `0.0.0.0` address are critical to explicitly block alongside standard private ranges to ensure robust protection against infrastructure attacks.

Action:
Always use exact matches or strictly bounded regular expressions (e.g., `^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$`) for validating IP addresses. Always explicitly block `169.254.169.254` and `0.0.0.0` in any SSRF prevention mechanism.