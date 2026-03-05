const { LLMClient } = require('../tools/llm_client');
const { logger } = require('../core/utils');

module.exports = class SummarizerAgent {
  constructor(config) {
    this.llm = new LLMClient(config);
    this.maxLength = config.agent.summaryLength || 500;
  }

  async execute(researchData) {
    logger.info('SummarizerAgent: Summarizing research data');

    const { sources } = researchData;
    if (sources.length === 0) {
      throw new Error('No sources to summarize');
    }

    // Combine content from all sources (truncate each to avoid token limit)
    const combinedText = sources.map(s => `Source: ${s.title}\n${s.content.substring(0, 2000)}`).join('\n\n---\n\n');

    let summary;
    try {
      summary = await this.llm.summarize(combinedText, 'detailed');
    } catch (err) {
      logger.warn('LLM summarize failed (missing API key?), using mock summary');
      // Mock summary: take first 200 words from each source and join
      const snippets = sources.map(s => s.content.substring(0, 200)).join(' ... ');
      summary = `Mock summary for ${researchData.topic}. Based on ${sources.length} sources.\n\nKey points:\n${snippets}`;
    }

    const wordCount = summary.split(/\s+/).length;
    logger.info(`Generated summary: ${wordCount} words`);

    return {
      topic: researchData.topic,
      summary,
      wordCount,
      sourceCount: sources.length,
      generatedAt: new Date().toISOString()
    };
  }
};
