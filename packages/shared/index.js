/**
 * User Roles in the Platform
 */
const ROLES = {
  STUDENT: 'STUDENT',
  INSTRUCTOR: 'INSTRUCTOR',
  ADMIN: 'ADMIN',
  SUPER_ADMIN: 'SUPER_ADMIN',
  MENTOR: 'MENTOR',
  COMPANY: 'COMPANY',
};

/**
 * Coding Problem Submission Statuses
 */
const SUBMISSION_STATUS = {
  QUEUED: 'QUEUED',
  RUNNING: 'RUNNING',
  PASSED: 'PASSED',
  FAILED: 'FAILED',
  TIMEOUT: 'TIMEOUT',
  MEMORY_LIMIT: 'MEMORY_LIMIT',
  RUNTIME_ERROR: 'RUNTIME_ERROR',
  COMPILE_ERROR: 'COMPILE_ERROR',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
};

/**
 * Coding Problem Difficulties
 */
const DIFFICULTY = {
  EASY: 'EASY',
  MEDIUM: 'MEDIUM',
  HARD: 'HARD',
};

/**
 * Job Application Statuses
 */
const JOB_STATUS = {
  SAVED: 'SAVED',
  APPLIED: 'APPLIED',
  SCREENING: 'SCREENING',
  INTERVIEW: 'INTERVIEW',
  REJECTED: 'REJECTED',
  SELECTED: 'SELECTED',
};

/**
 * Standard API Response Format Helper
 */
const formatResponse = (success, message, data = null, meta = null) => {
  const res = { success, message };
  if (data !== null) res.data = data;
  if (meta !== null) res.meta = meta;
  return res;
};

module.exports = {
  ROLES,
  SUBMISSION_STATUS,
  DIFFICULTY,
  JOB_STATUS,
  formatResponse,
};
