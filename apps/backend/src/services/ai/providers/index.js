const GeminiProvider = require('./gemini.provider');
const OpenAIProvider = require('./openai.provider');
const MockAIProvider = require('./mock.provider');

let cachedProvider = null;

/**
 * Returns configured AI Provider based on environment variables
 */
function getAIProvider() {
  if (cachedProvider && process.env.NODE_ENV !== 'test') {
    return cachedProvider;
  }

  const requestedProvider = (process.env.AI_PROVIDER || '').toLowerCase();

  if (requestedProvider === 'gemini' || (!requestedProvider && process.env.GEMINI_API_KEY)) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      cachedProvider = new GeminiProvider(key, process.env.AI_MODEL || 'gemini-1.5-flash');
      return cachedProvider;
    }
  }

  if (requestedProvider === 'openai' || (!requestedProvider && process.env.OPENAI_API_KEY)) {
    const key = process.env.OPENAI_API_KEY;
    if (key) {
      cachedProvider = new OpenAIProvider(key, process.env.AI_MODEL || 'gpt-4o-mini');
      return cachedProvider;
    }
  }

  // Default fallback to MockAIProvider
  cachedProvider = new MockAIProvider();
  return cachedProvider;
}

module.exports = {
  getAIProvider,
  GeminiProvider,
  OpenAIProvider,
  MockAIProvider,
};
