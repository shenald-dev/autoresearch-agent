const config = require('./config');
const { logger } = require('./utils');
const ResearchAgent = require('../agents/research_agent');
const SummarizerAgent = require('../agents/summarizer_agent');
const ContentGeneratorAgent = require('../agents/content_generator_agent');
const PublisherAgent = require('../agents/publisher_agent');

module.exports = class Orchestrator {
  constructor(cfg) {
    this.config = cfg;
    this.validate();
    this.researchAgent = new ResearchAgent(cfg);
    this.summarizerAgent = new SummarizerAgent(cfg);
    this.contentAgent = new ContentGeneratorAgent(cfg);
    this.publisherAgent = new PublisherAgent(cfg);
    logger.info('Orchestrator initialized');
  }

  validate() {
    const errors = config.validateConfig(this.config);
    if (errors.length > 0) {
      throw new Error('Config validation failed: ' + errors.join(', '));
    }
  }

  async run(topic, options = {}) {
    logger.info('=== Starting AutoResearch Pipeline ===');
    logger.info('Topic:', topic);

    try {
      // 1. Research
      const researchData = await this.researchAgent.execute(topic);

      // 2. Summarize
      const summaryData = await this.summarizerAgent.execute(researchData);

      // 3. Generate Content
      const contentData = await this.contentAgent.execute(summaryData, researchData);

      // 4. Publish (save files + optional social)
      const publishResults = await this.publisherAgent.execute(contentData, summaryData, researchData);

      logger.info('=== Pipeline Completed Successfully ===');

      return {
        success: true,
        topic,
        research: researchData,
        summary: summaryData,
        content: contentData,
        outputs: publishResults.files,
        posted: publishResults.posted,
        completedAt: new Date().toISOString()
      };
    } catch (error) {
      logger.error('Pipeline failed:', error);
      return {
        success: false,
        error: error.message,
        topic,
        failedAt: new Date().toISOString()
      };
    }
  }
};
