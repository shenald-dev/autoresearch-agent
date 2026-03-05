const { LLMClient } = require('../tools/llm_client');
const { logger } = require('../core/utils');

module.exports = class ContentGeneratorAgent {
  constructor(config) {
    this.llm = new LLMClient(config);
  }

  async execute(summaryData, researchData) {
    logger.info('ContentGeneratorAgent: Generating content');

    const { topic, summary } = summaryData;
    const references = researchData.sources;

    const [blog, tweets, video] = await Promise.all([
      this.generateBlog(topic, summary, references),
      this.generateTweetThread(topic, summary),
      this.generateVideoScript(topic, summary)
    ]);

    return {
      topic,
      generatedAt: new Date().toISOString(),
      content: {
        blog,
        tweetThread: tweets,
        videoScript: video
      }
    };
  }

  async generateBlog(topic, summary, references) {
    logger.info('Generating blog article...');
    try {
      return await this.llm.generateBlogArticle(topic, summary, references);
    } catch (e) {
      logger.warn('Blog generation failed, using mock:', e.message);
      const refs = references.slice(0, 3).map((r, i) => `[${i+1}] ${r.title}`).join('\n');
      return `# ${topic}\n\n## Introduction\n${summary}\n\n## References\n${refs}\n\n## Conclusion\nThis is a mock blog. Configure OPENAI_API_KEY for real content.`;
    }
  }

  async generateTweetThread(topic, summary) {
    logger.info('Generating tweet thread...');
    try {
      return await this.llm.generateTweetThread(topic, summary);
    } catch (e) {
      logger.warn('Tweet generation failed, using mock:', e.message);
      return `1/7 Thinking about ${topic}...\n\n${summary.substring(0, 200)}...\n\n2/7 Key insights incoming.\n\n3/7 Follow for more!`;
    }
  }

  async generateVideoScript(topic, summary) {
    logger.info('Generating video script...');
    try {
      return await this.llm.generateVideoScript(topic, summary);
    } catch (e) {
      logger.warn('Video script generation failed, using mock:', e.message);
      return `VIDEO: ${topic}\n\n[0:00-0:05] Hook: ${summary.substring(0, 100)}\n\n[0:05-0:50] Main content\n\n[0:50-1:00] Outro: Like & subscribe`;
    }
  }
};
