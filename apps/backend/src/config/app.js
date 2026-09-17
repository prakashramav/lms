/**
 * Centralized Application Settings
 * Phase 13 — Production Engineering
 */

const env = require('./env');

const APP_CONFIG = {
  NAME: 'AI-Powered Career & Learning Platform',
  VERSION: env.APP_VERSION || '1.0.0',
  API_PREFIX: '/api/v1',
  DEFAULT_PAGE_SIZE: 10,
  MAX_PAGE_SIZE: 50,
  REQUEST_BODY_LIMIT: '20mb',
  MAX_ARRAY_LENGTH: 100,
  SLOW_QUERY_THRESHOLD_MS: 150,
};

module.exports = APP_CONFIG;
