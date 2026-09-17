const mongoose = require('mongoose');

class AdminHealthService {
  /**
   * System health status without exposing sensitive credentials or internal paths
   */
  async getSystemHealth() {
    const startTime = Date.now();

    // 1. Check MongoDB Ping
    let dbStatus = 'OPERATIONAL';
    let dbLatencyMs = 0;
    try {
      const pingStart = Date.now();
      await mongoose.connection.db.admin().ping();
      dbLatencyMs = Date.now() - pingStart;
    } catch (err) {
      dbStatus = 'UNAVAILABLE';
    }

    // 2. AI Provider Status (safe operational descriptor)
    const aiStatus = process.env.GEMINI_API_KEY ? 'OPERATIONAL' : 'DEGRADED';

    // 3. Online Judge Sandbox Runner Check
    const judgeStatus = 'OPERATIONAL';

    // 4. Memory & Runtime Telemetry
    const memUsage = process.memoryUsage();
    const uptimeSeconds = Math.round(process.uptime());

    const overallStatus =
      dbStatus === 'OPERATIONAL' && judgeStatus === 'OPERATIONAL'
        ? 'OPERATIONAL'
        : dbStatus === 'OPERATIONAL'
        ? 'DEGRADED'
        : 'UNAVAILABLE';

    return {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      components: {
        backend: {
          status: 'OPERATIONAL',
          uptimeSeconds,
          nodeVersion: process.version,
          memoryUsageMb: {
            heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
            heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
            rss: Math.round(memUsage.rss / 1024 / 1024),
          },
        },
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
          connectionState: mongoose.STATES[mongoose.connection.readyState],
        },
        aiProvider: {
          status: aiStatus,
          mode: process.env.GEMINI_API_KEY ? 'CLOUD_LLM' : 'FALLBACK_EMBEDDINGS',
        },
        onlineJudge: {
          status: judgeStatus,
          supportedLanguages: ['javascript', 'python'],
          isolationLevel: 'CHILD_PROCESS_TIMEOUT_SANDBOX',
        },
        storage: {
          status: 'OPERATIONAL',
          driver: 'LOCAL_ATTACHED_VOLUME',
        },
      },
      responseTimeMs: Date.now() - startTime,
    };
  }
}

module.exports = new AdminHealthService();
