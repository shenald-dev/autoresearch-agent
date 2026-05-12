const fs = require('fs');
let content = fs.readFileSync('CHANGELOG.md', 'utf8');
content = content.replace(/<<<<<<< HEAD\n## \[1\.0\.27\] - 2026-05-07\n\* \*\*\[Optimization\]:\*\* Validated dependency injection of ConfigManager to prevent redundant file reads\.\n=======\n## \[1\.0\.27\] - 2026-05-11\n\* \*\*\[Optimized\]:\*\* Reused the ConfigManager instance across services to optimize file reads\.\n>>>>>>> origin\/master/,
'## [1.0.27] - 2026-05-11\n* **[Optimized]:** Reused the ConfigManager instance across services to optimize file reads.');
fs.writeFileSync('CHANGELOG.md', content);
