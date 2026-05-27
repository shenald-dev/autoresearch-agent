const fs = require('fs');

let content = fs.readFileSync('.jules/bolt.md', 'utf8');

const search = `<<<<<<< HEAD
=======

## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.
<<<<<<< HEAD
>>>>>>> origin/master
=======
## 2026-05-21 — Preemptive HTML Comment Stripping
Learning: Web documents frequently contain massive HTML comments that may harbor nested, unbroken, or malformed tags, which can trigger parsing anomalies and waste substantial LLM context tokens.
Action: Preemptively strip all HTML comments using regex before standard boilerplate tag cleanup during document processing.
## 2026-05-26 — Strict Allowlist for Fetch Content Types
Learning: A blocklist approach for rejecting non-text payloads (e.g., matching 'pdf', 'image/', 'video/') allows other arbitrary binaries (like zip, exe, audio) to be downloaded up to the 500KB limit, wasting bandwidth, memory, and CPU decoding garbage data.
Action: Implemented a strict allowlist in WebFetcher that only processes \`text/\`, \`application/json\`, \`application/xml\`, and \`application/xhtml\`, aggressively aborting streams for all other binary formats early.
>>>>>>> origin/master`;

const replace = `
## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.

## 2026-05-21 — Preemptive HTML Comment Stripping
Learning: Web documents frequently contain massive HTML comments that may harbor nested, unbroken, or malformed tags, which can trigger parsing anomalies and waste substantial LLM context tokens.
Action: Preemptively strip all HTML comments using regex before standard boilerplate tag cleanup during document processing.

## 2026-05-26 — Strict Allowlist for Fetch Content Types
Learning: A blocklist approach for rejecting non-text payloads (e.g., matching 'pdf', 'image/', 'video/') allows other arbitrary binaries (like zip, exe, audio) to be downloaded up to the 500KB limit, wasting bandwidth, memory, and CPU decoding garbage data.
Action: Implemented a strict allowlist in WebFetcher that only processes \`text/\`, \`application/json\`, \`application/xml\`, and \`application/xhtml\`, aggressively aborting streams for all other binary formats early.
`;

content = content.replace(search, replace);
fs.writeFileSync('.jules/bolt.md', content);
