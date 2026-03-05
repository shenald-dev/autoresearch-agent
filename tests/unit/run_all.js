/**
 * Run all unit tests
 */

const { execSync } = require('child_process');
const path = require('path');

const testFiles = [
  'test_web_search.js'
  // add more unit tests as created
];

let failed = 0;

for (const file of testFiles) {
  const filepath = path.join(__dirname, file);
  console.log(`\n▶ Running ${file}`);
  try {
    execSync(`node "${filepath}"`, { stdio: 'inherit' });
  } catch (e) {
    failed++;
  }
}

console.log(`\n📊 Unit tests completed. Failures: ${failed}`);
process.exit(failed > 0 ? 1 : 0);
