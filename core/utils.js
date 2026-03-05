const pino = require('pino');

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty'
  }
});

module.exports = {
  logger,

  sanitize(text) {
    // Remove excessive whitespace, normalize line endings
    return text.replace(/\s+/g, ' ').trim();
  },

  ensureDir(dir) {
    const fs = require('fs');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  },

  generateFilename(topic, ext) {
    const slug = topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 50);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    return `${slug}-${timestamp}.${ext}`;
  }
};
