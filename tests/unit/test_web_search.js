/**
 * Unit tests for web_search tool
 */

const { webSearch } = require('../../tools/web_search');

async function runTests() {
  console.log('🧪 Unit tests: web_search');
  let passed = 0, failed = 0;

  // Test 1: mock results when no API key
  try {
    const results = await webSearch.search('test query', 2);
    if (Array.isArray(results) && results.length >= 2) {
      console.log('✅ getMockResults returns at least 2 items');
      passed++;
    } else {
      console.log('❌ getMockResults failed', results);
      failed++;
    }
  } catch (e) {
    console.log('❌ Error:', e.message);
    failed++;
  }

  console.log(`\n📊 ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
