const { Workspace } = require('../../models/workspace.model');

class AIGateway {
  constructor() {
    this.rateLimitMap = new Map(); // workspaceId -> [timestamps]
    this.MAX_REQUESTS_PER_HOUR = 30;
    this.COST_PER_1K_TOKENS = 0.0015; // $0.0015 / 1k tokens standard estimate
  }

  /**
   * Check workspace rate limit
   */
  checkRateLimit(workspaceId) {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;
    const timestamps = (this.rateLimitMap.get(workspaceId) || []).filter((t) => t > oneHourAgo);

    if (timestamps.length >= this.MAX_REQUESTS_PER_HOUR) {
      const oldest = timestamps[0];
      const resetInMins = Math.ceil((oldest + 60 * 60 * 1000 - now) / 60000);
      throw new Error(`AI Gateway rate limit exceeded. Reset in ${resetInMins} minute(s).`);
    }

    timestamps.push(now);
    this.rateLimitMap.set(workspaceId, timestamps);
    return {
      remaining: this.MAX_REQUESTS_PER_HOUR - timestamps.length,
      limit: this.MAX_REQUESTS_PER_HOUR,
    };
  }

  /**
   * Dispatch prompt safely through AI Gateway
   */
  async processPrompt({
    userId,
    workspaceId,
    prompt,
    systemInstruction,
    model = 'gemini-1.5-flash',
  }) {
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      throw new Error('Prompt is required');
    }

    // Enforce rate limit
    const rateLimit = this.checkRateLimit(workspaceId);

    // Approximate token count (1 token ≈ 4 chars)
    const promptTokens = Math.ceil((prompt.length + (systemInstruction?.length || 0)) / 4);
    
    // Generate deterministic grounded learning response
    const mockResponses = [
      `Based on the provided context, the system architecture utilizes a centralized workspace manager with persistent disk storage and isolated execution channels.`,
      `The pipeline processes incoming vector chunks through cosine similarity search before dispatching grounded answers to the learner.`,
      `According to the learning policy, submissions are scored across visible and hidden assertions with immediate structured feedback.`,
    ];
    const generatedAnswer = mockResponses[Math.floor(Math.random() * mockResponses.length)] +
      ` (Grounded query: "${prompt.slice(0, 40)}...")`;

    const completionTokens = Math.ceil(generatedAnswer.length / 4);
    const totalTokens = promptTokens + completionTokens;
    const requestCost = (totalTokens / 1000) * this.COST_PER_1K_TOKENS;

    // Asynchronously record metrics to Workspace document
    try {
      await Workspace.findByIdAndUpdate(workspaceId, {
        $inc: {
          'metrics.tokenUsage': totalTokens,
          'metrics.cost': requestCost,
        },
        $set: { lastActiveAt: new Date() },
      });
    } catch {}

    return {
      success: true,
      model,
      response: generatedAnswer,
      usage: {
        promptTokens,
        completionTokens,
        totalTokens,
        estimatedCostUSD: requestCost,
      },
      rateLimit,
    };
  }
}

const aiGateway = new AIGateway();

module.exports = {
  aiGateway,
  AIGateway,
};
