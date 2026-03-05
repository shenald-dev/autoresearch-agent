const axios = require('axios');
const cheerio = require('cheerio');
const { logger, sanitize } = require('../core/utils');

module.exports = {
  async scrape(url) {
    try {
      const response = await axios.get(url, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; AutoResearchAgent/1.0)'
        }
      });

      const $ = cheerio.load(response.data);
      // Remove script, style, nav, footer
      $('script, style, nav, footer, header, aside').remove();

      // Get text from body or main content
      let text = $('body').text() || $('main').text() || $('article').text() || '';
      text = sanitize(text);

      // Truncate if too long
      if (text.length > 10000) {
        text = text.substring(0, 10000) + '...';
      }

      return {
        url,
        title: $('title').text() || '',
        text,
        success: true
      };
    } catch (error) {
      logger.error('Scrape failed for', url, error.message);
      return {
        url,
        title: '',
        text: '',
        success: false,
        error: error.message
      };
    }
  }
};
