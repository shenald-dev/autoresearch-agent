## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.
## 2026-05-21 — Preemptive HTML Comment Stripping
Learning: Web documents frequently contain massive HTML comments that may harbor nested, unbroken, or malformed tags, which can trigger parsing anomalies and waste substantial LLM context tokens.
Action: Preemptively strip all HTML comments using regex before standard boilerplate tag cleanup during document processing.