const axios = require('axios');
const { logger } = require('../core/utils');

module.exports = {
  async search(query, maxResults = 10) {
    const apiKey = process.env.SERPAPI_KEY;
    if (!apiKey) {
      logger.warn('SERPAPI_KEY not set, returning mock results');
      return this.getMockResults(query);
    }

    try {
      const response = await axios.get('https://serpapi.com/search', {
        params: {
          q: query,
          api_key: apiKey,
          num: maxResults,
          engine: 'google'
        }
      });

      const results = response.data.organic_results || [];
      return results.map(r => ({
        title: r.title,
        link: r.link,
        snippet: r.snippet,
        source: r.displayed_link
      }));
    } catch (error) {
      logger.error('Search failed:', error.message);
      return [];
    }
  },

  getMockResults(query) {
    // Fallback mock data for testing
    return [
      {
        title: `Result 1 for "${query}"`,
        link: 'https://example.com/1',
        snippet: `This is a mock search result about ${query}.`,
        source: 'example.com'
      },
      {
        title: `Result 2 for "${query}"`,
        link: 'https://example.com/2',
        snippet: `Another mock result for ${query} with more details.`,
        source: 'example.com'
      }
    ];
  }
};
