const env = require('./env');

const aiConfig = {
  provider: env.AI_PROVIDER || 'mock',
  model: env.AI_MODEL || 'gemini-1.5-flash',
  apiKey: env.AI_PROVIDER === 'gemini' ? env.GEMINI_API_KEY : env.OPENAI_API_KEY,
  maxPromptLength: 8000,
  maxTokens: 2048,
  timeoutMs: 15000,
  retryAttempts: 2,
  fallbackMessage: 'AI service is temporarily unavailable. Please try again in a few moments.',
};

module.exports = aiConfig;
