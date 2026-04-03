## 2025-04-03 — URL Parsing with IPv6 and dns.lookup
Learning: Node's `dns.lookup` strictly rejects bracketed IPv6 addresses (e.g., `[::1]`) which are returned by `url.URL().hostname`. Additionally, IPv4-mapped IPv6 addresses can be supplied in hex notation (e.g., `[::ffff:7f00:1]`) to bypass dotted-decimal string matching.
Action: Always strip brackets from IPv6 hostnames before passing them to `dns.lookup`. Enhance SSRF blocklists to catch hex-encoded IPv4-mapped IPv6 addresses for local, loopback, and private network ranges.
