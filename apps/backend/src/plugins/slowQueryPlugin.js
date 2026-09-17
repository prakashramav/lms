/**
 * Mongoose Slow Query Detection Plugin
 * Phase 13 — Database Production Hardening & Observability
 *
 * Monitors query execution duration and logs warning when queries exceed
 * the configured threshold (default: 150ms).
 * Strictly avoids logging sensitive query filter values.
 */

const APP_CONFIG = require('../config/app');

const SLOW_THRESHOLD_MS = APP_CONFIG.SLOW_QUERY_THRESHOLD_MS || 150;

const slowQueryPlugin = (schema) => {
  const operations = [
    'find',
    'findOne',
    'findOneAndUpdate',
    'findOneAndDelete',
    'updateMany',
    'deleteMany',
    'countDocuments',
  ];

  operations.forEach((op) => {
    schema.pre(op, function () {
      this._queryStartTime = Date.now();
    });

    schema.post(op, function () {
      if (this._queryStartTime) {
        const duration = Date.now() - this._queryStartTime;
        if (duration > SLOW_THRESHOLD_MS) {
          const modelName = (this.model && this.model.modelName) || 'UnknownModel';
          const collectionName = (this.mongooseCollection && this.mongooseCollection.name) || 'unknown_collection';
          // Log only metadata, collection, and operation — NEVER log sensitive filter parameter values
          console.warn(
            JSON.stringify({
              timestamp: new Date().toISOString(),
              level: 'WARN',
              event: 'SLOW_DATABASE_QUERY',
              model: modelName,
              collection: collectionName,
              operation: op,
              durationMs: duration,
              thresholdMs: SLOW_THRESHOLD_MS,
            })
          );
        }
      }
    });
  });
};

module.exports = slowQueryPlugin;
