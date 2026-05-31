const fs = require('fs');

let content = fs.readFileSync('.jules/warden.md', 'utf8');

content = content.replace(/<<<<<<< HEAD\nAligned the test suite execution\. Ran npm update to bump patch\/minor dependencies safely\. All tests passing\. Tagging release v1\.0\.28 to deploy these updates\.\n=======\nAligned the test suite execution\. Ran npm update to bump patch\/minor dependencies safely\. All tests passing\. Tagging release v1\.0\.27 to deploy these updates\.\n\n## 2026-05-11 — Assessment & Lifecycle \(2\)\n\n\*\*Observation \/ Pruned:\*\*\nObserved that BOLT effectively optimized the system by reusing the ConfigManager instance\. Pruned temporary resolution scripts `resolve_changelog\.js` and `resolve_warden\.js`\.\n\n\*\*Alignment \/ Deferred:\*\*\nAligned the test suite execution\. All tests passing\. Tagging release v1\.0\.28 to deploy these updates\.\n\n## 2026-05-20 — Assessment & Lifecycle\n\n\*\*Observation \/ Pruned:\*\*\nObserved that BOLT effectively optimized the `WebFetcher` charset extraction by replacing the inline regex parsing logic with a direct call to the shared `extractCharset` utility from `src\/utils\/http\.ts`\. This eliminates redundant logic and ensures consistent decoding behavior across the codebase\. Checked for dead code using `knip` and discovered `HttpError` was unnecessarily exported in `src\/tools\/GoogleSearcher\.ts`\. Removed the unused export\.\n\n\*\*Alignment \/ Deferred:\*\*\nAligned the test suite execution\. Ran `npm update` to bump patch\/minor dependencies safely\. All tests passing\. Tagging release v1\.0\.29 to deploy these updates\.\n>>>>>>> origin\/master/, `Aligned the test suite execution. Ran npm update to bump patch/minor dependencies safely. All tests passing. Tagging release v1.0.28 to deploy these updates.

## 2026-05-20 — Assessment & Lifecycle

**Observation / Pruned:**
Observed that BOLT effectively optimized the \`WebFetcher\` charset extraction by replacing the inline regex parsing logic with a direct call to the shared \`extractCharset\` utility from \`src/utils/http.ts\`. This eliminates redundant logic and ensures consistent decoding behavior across the codebase. Checked for dead code using \`knip\` and discovered \`HttpError\` was unnecessarily exported in \`src/tools/GoogleSearcher.ts\`. Removed the unused export.

**Alignment / Deferred:**
Aligned the test suite execution. Ran \`npm update\` to bump patch/minor dependencies safely. All tests passing. Tagging release v1.0.29 to deploy these updates.`);

fs.writeFileSync('.jules/warden.md', content);
