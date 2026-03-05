const express = require('express');

class App {
  constructor(options = {}) {
    this.port = options.port || 3001;
    this.mocksDir = options.mocksDir || './mocks';
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use((req, res, next) => {
      console.log(`[${req.method}] ${req.path}`);
      next();
    });
  }

  setupRoutes() {
    this.app.get('/_health', (req, res) => {
      res.json({ status: 'ok', name: 'autoresearch-agent', version: '0.1.0' });
    });

    // Add your routes here
    this.app.get('/api/hello', (req, res) => {
      res.json({ message: 'Hello!' });
    });

    this.app.use((req, res) => {
      res.status(404).json({ error: 'Not found' });
    });
  }

  start() {
    const server = this.app.listen(this.port, () => {
      console.log(`ðŸš€ autoresearch-agent listening on http://localhost:${this.port}`);
    });
    return server;
  }
}

// If run directly (node src/index.js), start server with defaults
if (require.main === module) {
  const app = new App();
  app.start();
}

module.exports = App;

