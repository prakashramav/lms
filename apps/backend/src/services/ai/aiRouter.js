/**
 * Advanced AI Router with Circuit Breaker, Provider Fallbacks, Caching & Quota Tracking
 * Phase 15 — AI Router & Circuit Breaker (Sections 37 - 41)
 */

const { getAIProvider, MockAIProvider } = require('./providers');
const observability = require('../observability/observability.service');

const CIRCUIT_STATES = {
  CLOSED: 'CLOSED',       // Normal operation
  OPEN: 'OPEN',           // Tripped, failing fast without hitting external API
  HALF_OPEN: 'HALF_OPEN', // Testing recovery with a single probe request
};

class AICircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 3;
    this.cooldownPeriodMs = options.cooldownPeriodMs || 30000;
    this.state = CIRCUIT_STATES.CLOSED;
    this.consecutiveFailures = 0;
    this.lastFailureTime = null;
  }

  isOpen() {
    if (this.state === CIRCUIT_STATES.OPEN) {
      const now = Date.now();
      if (now - this.lastFailureTime > this.cooldownPeriodMs) {
        this.state = CIRCUIT_STATES.HALF_OPEN;
        return false;
      }
      return true;
    }
    return false;
  }

  recordSuccess() {
    this.consecutiveFailures = 0;
    this.state = CIRCUIT_STATES.CLOSED;
  }

  recordFailure() {
    this.consecutiveFailures += 1;
    this.lastFailureTime = Date.now();

    if (this.consecutiveFailures >= this.failureThreshold) {
      this.state = CIRCUIT_STATES.OPEN;
    }
  }

  getStatus() {
    return {
      state: this.state,
      consecutiveFailures: this.consecutiveFailures,
      lastFailureTime: this.lastFailureTime,
      isOpen: this.isOpen(),
    };
  }
}

class AIRouter {
  constructor() {
    this.circuitBreaker = new AICircuitBreaker();
    this.cache = new Map(); // promptHash -> { response, expiresAt }
    this.mockFallback = new MockAIProvider();
    this.quotas = new Map(); // userId -> { count, limit, windowStart }
    this.defaultTimeoutMs = 15000;
  }

  _checkQuota(userId, tier = 'STANDARD') {
    if (!userId) return true;
    const now = Date.now();
    const limits = {
      FREE: 20,
      STANDARD: 100,
      PREMIUM: 500,
      ENTERPRISE: 2000,
    };
    const maxRequestsPerHour = limits[tier] || limits.STANDARD;

    let userQuota = this.quotas.get(userId);
    if (!userQuota || now - userQuota.windowStart > 60 * 60 * 1000) {
      userQuota = { count: 0, windowStart: now };
      this.quotas.set(userId, userQuota);
    }

    if (userQuota.count >= maxRequestsPerHour) {
      throw new Error(`AI rate quota exceeded for tier ${tier}. Maximum ${maxRequestsPerHour} requests/hour.`);
    }

    userQuota.count += 1;
    return true;
  }

  async execute({ prompt, systemInstruction = '', userId = null, tier = 'STANDARD', isDeterministic = false, timeoutMs = null }) {
    const start = Date.now();

    // 1. Quota check
    if (userId) {
      this._checkQuota(userId, tier);
    }

    // 2. Deterministic cache check
    const cacheKey = isDeterministic ? `${systemInstruction}:${prompt}` : null;
    if (cacheKey && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (cached.expiresAt > Date.now()) {
        observability.recordCacheHit();
        return {
          content: cached.response,
          source: 'CACHE',
          latencyMs: Date.now() - start,
          cached: true,
        };
      }
      this.cache.delete(cacheKey);
    }

    // 3. Circuit breaker check
    if (this.circuitBreaker.isOpen()) {
      observability.recordAIRequest(Date.now() - start, true);
      // Degrade gracefully via mock fallback
      const fallbackRes = await this.mockFallback.generateResponse({
        systemPrompt: systemInstruction,
        messages: [{ role: 'user', content: prompt }],
      });
      return {
        content: fallbackRes.content || fallbackRes.text || fallbackRes,
        source: 'CIRCUIT_BREAKER_FALLBACK',
        circuitState: CIRCUIT_STATES.OPEN,
        latencyMs: Date.now() - start,
      };
    }

    // 4. Primary provider invocation with timeout
    const effectiveTimeout = timeoutMs || this.defaultTimeoutMs;
    let timerId;
    try {
      const provider = getAIProvider();

      const callPromise = provider.generateResponse({
        systemPrompt: systemInstruction,
        messages: [{ role: 'user', content: prompt }],
      });
      const timeoutPromise = new Promise((_, reject) => {
        timerId = setTimeout(() => reject(new Error('AI provider request timed out')), effectiveTimeout);
      });

      const result = await Promise.race([callPromise, timeoutPromise]);
      if (timerId) clearTimeout(timerId);

      const content = result.content || result.text || result;
      const latencyMs = Date.now() - start;

      this.circuitBreaker.recordSuccess();
      observability.recordAIRequest(latencyMs, false);

      if (cacheKey) {
        this.cache.set(cacheKey, {
          response: content,
          expiresAt: Date.now() + 60 * 60 * 1000, // 1 hour TTL
        });
      }

      return {
        content,
        source: provider.name || 'PRIMARY_AI',
        latencyMs,
      };
    } catch (err) {
      if (timerId) clearTimeout(timerId);
      this.circuitBreaker.recordFailure();
      const latencyMs = Date.now() - start;
      observability.recordAIRequest(latencyMs, true);

      // 5. Provider fallback to resilient mock provider
      const fallbackResult = await this.mockFallback.generateResponse({
        systemPrompt: systemInstruction,
        messages: [{ role: 'user', content: prompt }],
      });
      return {
        content: fallbackResult.content || fallbackResult.text || fallbackResult,
        source: 'RESILIENT_FALLBACK',
        warning: `Primary provider error: ${err.message}`,
        latencyMs,
      };
    } finally {
      if (timerId) clearTimeout(timerId);
    }
  }

  async chat(messages = [], options = {}) {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role === 'user');
    const prompt = userMessages.map((m) => m.content).join('\n\n');
    return await this.execute({
      prompt,
      systemInstruction: systemMessage?.content || '',
      userId: options.userId,
      tier: options.tier || 'STANDARD',
      isDeterministic: options.isDeterministic || false,
    });
  }

  getCircuitStatus() {
    return this.circuitBreaker.getStatus();
  }

  resetCircuit() {
    this.circuitBreaker.state = CIRCUIT_STATES.CLOSED;
    this.circuitBreaker.consecutiveFailures = 0;
  }
}

const aiRouter = new AIRouter();
module.exports = {
  aiRouter,
  CIRCUIT_STATES,
};
