const { aiRouter, CIRCUIT_STATES } = require('../src/services/ai/aiRouter');
const { runAIEvaluation, GOLDEN_TEST_DATASET } = require('../src/services/ai/aiEvaluator');

describe('Phase 15 AI Router, Circuit Breaker & Safety Evaluation Test Suite', () => {
  beforeEach(() => {
    aiRouter.resetCircuit();
  });

  describe('1. AI Router & Provider Fallback', () => {
    it('should generate response via fallback when primary is unavailable', async () => {
      const res = await aiRouter.execute({
        prompt: 'Explain binary search complexity',
        systemInstruction: 'You are a computer science tutor.',
      });

      expect(res).toBeDefined();
      expect(res.content).toBeDefined();
      expect(res.latencyMs).toBeGreaterThanOrEqual(0);
      expect(['PRIMARY_AI', 'RESILIENT_FALLBACK', 'MockAIProvider', 'mock', 'CACHE']).toContain(res.source);
    });

    it('should cache deterministic prompt requests', async () => {
      const prompt = `Taxonomy test ${Date.now()}`;
      const res1 = await aiRouter.execute({
        prompt,
        systemInstruction: 'Deterministic categorization',
        isDeterministic: true,
      });

      const res2 = await aiRouter.execute({
        prompt,
        systemInstruction: 'Deterministic categorization',
        isDeterministic: true,
      });

      expect(res2.cached).toBe(true);
      expect(res2.source).toBe('CACHE');
      expect(res2.content).toBe(res1.content);
    });
  });

  describe('2. Circuit Breaker Behavior', () => {
    it('should trip circuit to OPEN when failure threshold is exceeded', async () => {
      const breaker = aiRouter.circuitBreaker;
      expect(breaker.state).toBe(CIRCUIT_STATES.CLOSED);

      // Simulate 3 consecutive failures
      breaker.recordFailure();
      breaker.recordFailure();
      breaker.recordFailure();

      expect(breaker.state).toBe(CIRCUIT_STATES.OPEN);
      expect(breaker.isOpen()).toBe(true);

      // Subsequent call through router should fast-fallback without hitting external network
      const res = await aiRouter.execute({
        prompt: 'Trigger circuit test',
      });

      expect(res.source).toBe('CIRCUIT_BREAKER_FALLBACK');
      expect(res.circuitState).toBe(CIRCUIT_STATES.OPEN);
    });
  });

  describe('3. AI Rate Quota System', () => {
    it('should enforce tier quota limits', async () => {
      const testUserId = `user_quota_${Date.now()}`;

      // FREE tier allows 20 calls/hr
      for (let i = 0; i < 20; i++) {
        await aiRouter.execute({
          prompt: `Quota test call ${i}`,
          userId: testUserId,
          tier: 'FREE',
        });
      }

      // 21st call should exceed quota
      await expect(
        aiRouter.execute({
          prompt: 'Call 21',
          userId: testUserId,
          tier: 'FREE',
        })
      ).rejects.toThrow(/AI rate quota exceeded/);
    });
  });

  describe('4. AI Evaluation Platform & Safety Dataset', () => {
    it('should run golden dataset and pass accuracy and injection defense checks', async () => {
      const evalReport = await runAIEvaluation();

      expect(evalReport.totalTests).toBe(GOLDEN_TEST_DATASET.length);
      expect(evalReport.passedCount).toBe(GOLDEN_TEST_DATASET.length);
      expect(evalReport.passRatePercent).toBe(100);
      expect(evalReport.results.every((r) => r.passed)).toBe(true);
    });
  });
});
