const { writeMarkdown, writeJSON } = require('../tools/file_writer');
const { postToTwitter, postToLinkedIn } = require('../tools/social_poster');
const { logger } = require('../core/utils');

module.exports = class PublisherAgent {
  constructor(config) {
    this.config = config;
    this.enablePosting = config.agent.enablePublishing;
  }

  async execute(contentData, summaryData, researchData) {
    logger.info('PublisherAgent: Saving outputs');

    const topicSlug = researchData.topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').substring(0, 30);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    // Save blog as Markdown
    const blogPath = await writeMarkdown(contentData.content.blog, topicSlug, `blog-${timestamp}`);
    const blogJSON = { topic: researchData.topic, content: contentData.content.blog, type: 'blog', generatedAt: contentData.generatedAt };
    const blogJsonPath = await writeJSON(blogJSON, topicSlug, `blog-${timestamp}`);

    // Save tweet thread
    const tweetPath = await writeMarkdown(contentData.content.tweetThread, topicSlug, `tweets-${timestamp}`);
    const tweetJSON = { topic: researchData.topic, content: contentData.content.tweetThread, type: 'tweet_thread', generatedAt: contentData.generatedAt };
    const tweetJsonPath = await writeJSON(tweetJSON, topicSlug, `tweets-${timestamp}`);

    // Save video script
    const videoPath = await writeMarkdown(contentData.content.videoScript, topicSlug, `video-${timestamp}`);
    const videoJSON = { topic: researchData.topic, content: contentData.content.videoScript, type: 'video_script', generatedAt: contentData.generatedAt };
    const videoJsonPath = await writeJSON(videoJSON, topicSlug, `video-${timestamp}`);

    // Save full research data (source references)
    const fullPath = await writeJSON(researchData, topicSlug, `full-${timestamp}`);

    logger.info(`Outputs saved to: ${blogPath}, ${tweetPath}, ${videoPath}`);

    const results = {
      files: {
        blog: blogPath,
        tweets: tweetPath,
        video: videoPath,
        fullResearch: fullPath
      },
      posted: { twitter: false, linkedIn: false }
    };

    // Auto-post if enabled
    if (this.enablePosting) {
      try {
        const twitterRes = await postToTwitter(contentData.content.tweetThread);
        results.posted.twitter = twitterRes.success || false;
        logger.info('Twitter post:', twitterRes);
      } catch (e) {
        logger.error('Twitter post failed:', e.message);
      }
    }

    return results;
  }
};
