## 2025-05-19 — Dynamic Charset Decoding
Learning: Hardcoding TextDecoder() without extracting the charset from Content-Type can lead to runtime crashes or incorrect decoding when fetching non-utf-8 web content.
Action: Always extract the charset using a regex on Content-Type and wrap TextDecoder instantiation in a try-catch fallback to utf-8.