require('dotenv').config();

module.exports = {
  loadConfig() {
    return {
      openai: {
        apiKey: process.env.OPENAI_API_KEY,
        model: process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
        maxTokens: parseInt(process.env.OPENAI_MAX_TOKENS) || 2000
      },
      serpapi: {
        apiKey: process.env.SERPAPI_KEY
      },
      output: {
        markdownDir: process.env.OUTPUT_MD_DIR || 'outputs/markdown',
        jsonDir: process.env.OUTPUT_JSON_DIR || 'outputs/json'
      },
      agent: {
        maxSearchResults: parseInt(process.env.MAX_SEARCH_RESULTS) || 10,
        summaryLength: parseInt(process.env.SUMMARY_LENGTH) || 500,
        enablePublishing: process.env.ENABLE_PUBLISHING === 'true' || false
      }
    };
  },

  validateConfig(cfg) {
    const errors = [];
    if (!cfg.openai.apiKey) errors.push('OPENAI_API_KEY is required');
    if (!cfg.serpapi.apiKey) errors.push('SERPAPI_KEY is required (or set ENABLE_SEARCH=false)');
    return errors;
  }
};
