const BaseAIProvider = require('./base.provider');

/**
 * OpenAI Provider implementation using REST API
 */
class OpenAIProvider extends BaseAIProvider {
  constructor(apiKey, model = 'gpt-4o-mini') {
    super('openai');
    this.apiKey = apiKey;
    this.model = model;
    this.baseUrl = 'https://api.openai.com/v1/chat/completions';
  }

  formatMessages(systemPrompt, messages) {
    const list = [];
    if (systemPrompt) {
      list.push({ role: 'system', content: systemPrompt });
    }
    for (const msg of messages) {
      list.push({
        role: msg.role === 'USER' || msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }
    return list;
  }

  async generateResponse({ systemPrompt, messages, temperature = 0.7, maxTokens = 1500 }) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const formatted = this.formatMessages(systemPrompt, messages);
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: formatted,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`OpenAI API Error (${res.status}): ${errorData.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      content: data.choices?.[0]?.message?.content || '',
      tokenUsage: {
        promptTokens: data.usage?.prompt_tokens || 0,
        completionTokens: data.usage?.completion_tokens || 0,
        totalTokens: data.usage?.total_tokens || 0,
      },
    };
  }

  async *generateStream({ systemPrompt, messages, temperature = 0.7, maxTokens = 1500 }) {
    if (!this.apiKey) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    const formatted = this.formatMessages(systemPrompt, messages);
    const res = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.model,
        messages: formatted,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`OpenAI Stream Error (${res.status}): ${errorData.error?.message || res.statusText}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith('data: ')) {
          const jsonStr = trimmed.slice(6);
          if (jsonStr === '[DONE]') break;
          try {
            const parsed = JSON.parse(jsonStr);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              yield { token: delta, done: false };
            }
          } catch (e) {}
        }
      }
    }

    yield { token: '', done: true };
  }
}

module.exports = OpenAIProvider;
