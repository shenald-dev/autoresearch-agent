const { webSearch, scrape } = require('../tools/web_search'); // webSearch module exports search
const { logger } = require('../core/utils');

module.exports = class ResearchAgent {
  constructor(config) {
    this.maxResults = config.agent.maxSearchResults || 10;
  }

  async execute(topic) {
    logger.info('ResearchAgent: Starting research on', topic);

    // 1. Search web
    const searchResults = await webSearch.search(topic, this.maxResults);
    logger.info(`Found ${searchResults.length} search results`);

    // 2. Scrape each result
    const scraped = [];
    for (const result of searchResults) {
      const data = await scrape(result.link);
      if (data.success) {
        scraped.push({
          title: result.title,
          link: result.link,
          source: result.source,
          content: data.text,
          snippet: result.snippet
        });
      }
    }

    logger.info(`Successfully scraped ${scraped.length} sources`);

    return {
      topic,
      timestamp: new Date().toISOString(),
      sources: scraped,
      totalSources: scraped.length
    };
  }
};
