const OpenAI = require('openai');
const { logger } = require('../core/utils');

class LLMClient {
  constructor(config) {
    this.openai = new OpenAI({
      apiKey: config.openai.apiKey
    });
    this.model = config.openai.model;
    this.maxTokens = config.openai.maxTokens;
  }

  async chat(prompt, systemPrompt = 'You are a helpful research assistant.') {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt }
        ],
        max_tokens: this.maxTokens,
        temperature: 0.7
      });

      return response.choices[0].message.content;
    } catch (error) {
      logger.error('LLM call failed:', error.message);
      throw error;
    }
  }

  async summarize(text, style = 'concise') {
    const prompt = `Summarize the following text in a ${style} manner (${style === 'concise' ? '2-3 sentences' : 'detailed paragraph'}):\n\n${text.substring(0, 8000)}`;
    return await this.chat(prompt, 'You are an expert summarizer.');
  }

  async generateBlogArticle(topic, summary, references = []) {
    const prompt = `Write a blog article about: ${topic}\n\nBased on this summary:\n${summary}\n\nReferences:\n${references.map((r, i) => `${i+1}. ${r.title}: ${r.link}`).join('\n')}\n\nInclude an introduction, key points, and conclusion. Use Markdown formatting.`;
    return await this.chat(prompt, 'You are a professional tech writer. Write in an engaging, informative style. Use headings, bullet points, and code blocks where appropriate.');
  }

  async generateTweetThread(topic, summary) {
    const prompt = `Create a Twitter thread (5-7 tweets) about: ${topic}\n\nBased on this summary:\n${summary}\n\nEach tweet should be under 280 characters. Start with a hook, add insights, and end with a call-to-action. Number tweets (1/7), (2/7), etc.`;
    return await this.chat(prompt, 'You are a social media expert. Write engaging, viral-style threads.');
  }

  async generateVideoScript(topic, summary) {
    const prompt = `Write a video script for a 60-second short video about: ${topic}\n\nBased on this summary:\n${summary}\n\nInclude: opening hook (5 sec), main points (45 sec), closing call-to-action (10 sec). Write narration text and scene descriptions.`;
    return await this.chat(prompt, 'You are a video scriptwriter. Write in a conversational, high-energy tone.');
  }
}

module.exports = { LLMClient };
