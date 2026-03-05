/**
 * autoresearch-agent â€” basic tests
 */

const http = require('http');
const App = require('../src/index');

function request(pathStr, port = 3001) {
  return new Promise((resolve, reject) => {
    http.get(`http://localhost:${port}${pathStr}`, res => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch (e) {
          resolve({ status: res.statusCode, body: data });
        }
      });
    }).on('error', reject);
  });
}

async function runTests() {
  console.log('ðŸ§ª Running autoresearch-agent tests...');
  const port = 3001;
  let passed = 0, failed = 0;

  // Start server
  const app = new App({ port });
  const server = app.start(); // modify start() to return server

  // Wait for startup
  await new Promise(r => setTimeout(r, 500));

  try {
    // Health check
    const h = await request('/_health', port);
    if (h.status === 200 && h.body.status === 'ok') {
      console.log('âœ… Health check');
      passed++;
    } else {
      console.log('âŒ Health failed', h);
      failed++;
    }

    // Example endpoint
    const r = await request('/api/hello', port);
    if (r.status === 200 && r.body.message) {
      console.log('âœ… Hello endpoint');
      passed++;
    } else {
      console.log('âŒ Hello failed', r);
      failed++;
    }

    // 404
    const n = await request('/unknown', port);
    if (n.status === 404) {
      console.log('âœ… 404 handling');
      passed++;
    } else {
      console.log('âŒ 404 failed', n);
      failed++;
    }
  } catch (e) {
    console.log('âŒ Test error:', e.message);
    failed++;
  } finally {
    server.close();
  }

  console.log(`\nðŸ“Š ${passed} passed, ${failed} failed`);
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});

