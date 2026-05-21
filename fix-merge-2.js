const { execSync } = require('child_process');
const fs = require('fs');

// Fix .jules/warden.md
let wardenContent = fs.readFileSync('.jules/warden.md', 'utf8');
wardenContent = wardenContent.replace(/<<<<<<< HEAD[\s\S]*?=======\n/, '');
wardenContent = wardenContent.replace(/>>>>>>> origin\/master\n/, '');
fs.writeFileSync('.jules/warden.md', wardenContent);

// Fix CHANGELOG.md
let clContent = fs.readFileSync('CHANGELOG.md', 'utf8');
clContent = clContent.replace(/<<<<<<< HEAD[\s\S]*?=======\n/, '');
clContent = clContent.replace(/>>>>>>> origin\/master\n/, '');
fs.writeFileSync('CHANGELOG.md', clContent);

// Fix package.json
let pjContent = fs.readFileSync('package.json', 'utf8');
pjContent = pjContent.replace(/<<<<<<< HEAD[\s\S]*?=======\n/, '');
pjContent = pjContent.replace(/>>>>>>> origin\/master\n/, '');
fs.writeFileSync('package.json', pjContent);

// Fix src/tools/GoogleSearcher.ts
let gsContent = fs.readFileSync('src/tools/GoogleSearcher.ts', 'utf8');
gsContent = gsContent.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, '');
gsContent = gsContent.replace(/>>>>>>> origin\/master\n/g, '');
fs.writeFileSync('src/tools/GoogleSearcher.ts', gsContent);

// Fix src/tools/WebFetcher.ts
let wfContent = fs.readFileSync('src/tools/WebFetcher.ts', 'utf8');
wfContent = wfContent.replace(/<<<<<<< HEAD\n\t\t\t\t\/\/ Robust HTML to Text stripping using Cheerio\n\t\t\t\tconst \$ = load\(text\);\n\t\t\t\t\$\("script, style, svg, nav, footer, iframe, noscript"\)\.remove\(\);\n\t\t\t\tconst strippedText = \$\.text\(\)\.replace\(\/\\s\+\/g, " "\)\.trim\(\);\n=======\n\t\t\t\t\/\/ Basic HTML to Text stripping \(a real app would use cheerio or html-to-text\)\n\t\t\t\tconst strippedText = text\n\t\t\t\t\t\.replace\(\n\t\t\t\t\t\t\/<\(script\|style\|svg\|nav\|footer\|iframe\|noscript\)\\b\[\^>\]\*>\[\\s\\S\]\*\?\(?:<\\\/\\1>\|\$\)\/gi,\n\t\t\t\t\t\t"",\n\t\t\t\t\t\) \/\/ Remove complete and unclosed boilerplate blocks\n\t\t\t\t\t\.replace\(\/<\\[\^>\]\+>\|<\\[\^>\]\*\$\/g, " "\) \/\/ Remove complete HTML tags and any trailing partial HTML tag\n\t\t\t\t\t\.replace\(\/\\s\+\/g, " "\)\n\t\t\t\t\t\.trim\(\);\n>>>>>>> origin\/master\n/, `				// Robust HTML to Text stripping using Cheerio
				const $ = load(text);
				$("script, style, svg, nav, footer, iframe, noscript").remove();
				const strippedText = $.text().replace(/\\s+/g, " ").trim();\n`);
fs.writeFileSync('src/tools/WebFetcher.ts', wfContent);

// Fix tests/WebFetcher.test.ts
let wtContent = fs.readFileSync('tests/WebFetcher.test.ts', 'utf8');
wtContent = wtContent.replace(/<<<<<<< HEAD[\s\S]*?=======\n/g, '');
wtContent = wtContent.replace(/>>>>>>> origin\/master\n/g, '');
fs.writeFileSync('tests/WebFetcher.test.ts', wtContent);

// Fix package-lock.json
execSync('npm install');
