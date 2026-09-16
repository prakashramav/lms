const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

/**
 * Standard fetch helper with error handling
 */
async function request(endpoint, options = {}, token) {
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    const error = new Error(data.message || `Request failed with status ${res.status}`);
    error.statusCode = res.status;
    error.errorCode = data.errorCode;
    throw error;
  }

  return data;
}

export const aiService = {
  // Conversations
  async getConversations(token, params = {}) {
    const query = new URLSearchParams(params).toString();
    return request(`/ai/conversations?${query}`, { method: 'GET' }, token);
  },

  async createConversation(token, data) {
    return request('/ai/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async getConversationById(token, conversationId) {
    return request(`/ai/conversations/${conversationId}`, { method: 'GET' }, token);
  },

  async deleteConversation(token, conversationId) {
    return request(`/ai/conversations/${conversationId}`, { method: 'DELETE' }, token);
  },

  async sendMessage(token, conversationId, data) {
    return request(`/ai/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  /**
   * Stream message using Server-Sent Events (SSE)
   */
  async streamMessage(token, conversationId, payload, { onToken, onDone, onError }) {
    try {
      const res = await fetch(`${API_BASE_URL}/ai/conversations/${conversationId}/messages?stream=true`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Streaming error: ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() || '';

        for (const block of lines) {
          const trimmed = block.trim();
          if (trimmed.startsWith('data: ')) {
            try {
              const parsed = JSON.parse(trimmed.slice(6));
              if (parsed.token) {
                onToken?.(parsed.token);
              }
              if (parsed.done) {
                onDone?.(parsed);
              }
            } catch (e) {}
          }
        }
      }
    } catch (err) {
      onError?.(err);
    }
  },

  // Specialized Pedagogical Endpoints
  async getHint(token, data) {
    return request('/ai/hint', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async explainError(token, data) {
    return request('/ai/explain', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async reviewCode(token, data) {
    return request('/ai/code-review', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async summarizeLesson(token, data) {
    return request('/ai/summarize', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async generateStudyPlan(token, data) {
    return request('/ai/study-plan', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async generatePractice(token, data) {
    return request('/ai/generate-practice', {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },

  async submitFeedback(token, messageId, data) {
    return request(`/ai/messages/${messageId}/feedback`, {
      method: 'POST',
      body: JSON.stringify(data),
    }, token);
  },
};
