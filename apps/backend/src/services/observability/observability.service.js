/**
 * Observability, Metrics & Telemetry Service
 * Phase 15 — Observability & Performance Budgets (Sections 10 - 18)
 */

class ObservabilityService {
  constructor() {
    this.metrics = {
      requestsTotal: 0,
      errorsTotal: 0,
      requestDurationsMs: [],
      dbQueriesTotal: 0,
      dbLatencyMs: [],
      cacheHits: 0,
      cacheMisses: 0,
      aiRequestsTotal: 0,
      aiErrorsTotal: 0,
      aiLatencyMs: [],
      activeJobsCount: 0,
      workerFailuresTotal: 0,
      queueDepth: 0,
    };
    this.startTime = Date.now();
  }

  recordRequest(latencyMs, isError = false) {
    this.metrics.requestsTotal += 1;
    if (isError) this.metrics.errorsTotal += 1;
    if (this.metrics.requestDurationsMs.length > 500) {
      this.metrics.requestDurationsMs.shift();
    }
    this.metrics.requestDurationsMs.push(latencyMs);
  }

  recordDbQuery(latencyMs) {
    this.metrics.dbQueriesTotal += 1;
    if (this.metrics.dbLatencyMs.length > 200) {
      this.metrics.dbLatencyMs.shift();
    }
    this.metrics.dbLatencyMs.push(latencyMs);
  }

  recordCacheHit() {
    this.metrics.cacheHits += 1;
  }

  recordCacheMiss() {
    this.metrics.cacheMisses += 1;
  }

  recordAIRequest(latencyMs, isError = false) {
    this.metrics.aiRequestsTotal += 1;
    if (isError) this.metrics.aiErrorsTotal += 1;
    if (this.metrics.aiLatencyMs.length > 200) {
      this.metrics.aiLatencyMs.shift();
    }
    this.metrics.aiLatencyMs.push(latencyMs);
  }

  setQueueDepth(depth) {
    this.metrics.queueDepth = depth;
  }

  setActiveJobs(count) {
    this.metrics.activeJobsCount = count;
  }

  recordWorkerFailure() {
    this.metrics.workerFailuresTotal += 1;
  }

  _calculatePercentile(arr, p) {
    if (!arr.length) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return Math.round(sorted[Math.max(0, index)]);
  }

  getSnapshot() {
    const uptimeSec = Math.round((Date.now() - this.startTime) / 1000);
    const totalCacheRequests = this.metrics.cacheHits + this.metrics.cacheMisses;
    const cacheHitRate = totalCacheRequests > 0
      ? Math.round((this.metrics.cacheHits / totalCacheRequests) * 100)
      : 100;

    return {
      uptimeSec,
      requests: {
        total: this.metrics.requestsTotal,
        errors: this.metrics.errorsTotal,
        errorRatePercent: this.metrics.requestsTotal > 0
          ? Number(((this.metrics.errorsTotal / this.metrics.requestsTotal) * 100).toFixed(2))
          : 0,
        latency: {
          p50Ms: this._calculatePercentile(this.metrics.requestDurationsMs, 50),
          p95Ms: this._calculatePercentile(this.metrics.requestDurationsMs, 95),
          p99Ms: this._calculatePercentile(this.metrics.requestDurationsMs, 99),
        },
      },
      database: {
        totalQueries: this.metrics.dbQueriesTotal,
        avgLatencyMs: this._calculatePercentile(this.metrics.dbLatencyMs, 50),
      },
      cache: {
        hits: this.metrics.cacheHits,
        misses: this.metrics.cacheMisses,
        hitRatePercent: cacheHitRate,
      },
      ai: {
        totalCalls: this.metrics.aiRequestsTotal,
        errors: this.metrics.aiErrorsTotal,
        p95LatencyMs: this._calculatePercentile(this.metrics.aiLatencyMs, 95),
      },
      queue: {
        depth: this.metrics.queueDepth,
        activeJobs: this.metrics.activeJobsCount,
        workerFailures: this.metrics.workerFailuresTotal,
      },
    };
  }
}

const observability = new ObservabilityService();
module.exports = observability;
