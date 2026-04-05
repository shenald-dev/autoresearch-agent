## 2025-02-24 — SSRF IP Validation with ipaddr.js

Learning:
Manual string matching and regex for SSRF IP range validation is brittle and misses complex edge cases like IPv4-mapped IPv6 addresses (e.g., `::ffff:127.0.0.1`), loopbacks, and Carrier Grade NAT.

Action:
Always use `ipaddr.js` (specifically `ipaddr.process()` followed by `.range()`) to validate IP addresses securely. Reject ranges like `private`, `loopback`, `linkLocal`, `unspecified`, `broadcast`, `uniqueLocal`, and `carrierGradeNat` for outgoing requests in security-sensitive paths.
