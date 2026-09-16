/**
 * Base AI Provider Abstract Class
 */
class BaseAIProvider {
  constructor(name = 'base') {
    this.name = name;
  }

  /**
   * Generates a complete textual response from system prompt + conversation history
   * @param {object} params
   * @param {string} params.systemPrompt
   * @param {Array<{role: string, content: string}>} params.messages
   * @param {number} [params.temperature=0.7]
   * @param {number} [params.maxTokens=1024]
   * @returns {Promise<{content: string, tokenUsage: {promptTokens: number, completionTokens: number, totalTokens: number}}>}
   */
  async generateResponse(params) {
    throw new Error(`generateResponse() not implemented on ${this.name}`);
  }

  /**
   * Generates a streaming response yielding chunks of text
   * @param {object} params
   * @returns {AsyncGenerator<{token: string, done: boolean}>}
   */
  async *generateStream(params) {
    const response = await this.generateResponse(params);
    // Default streaming fallback chunking by words
    const words = response.content.split(' ');
    for (let i = 0; i < words.length; i++) {
      yield { token: (i === 0 ? '' : ' ') + words[i], done: false };
    }
    yield { token: '', done: true };
  }
}

module.exports = BaseAIProvider;
