const AuditLog = require('../models/auditLog.model');

/**
 * Log instructor or administrative action
 * @param {object} params
 * @param {string} params.actorId
 * @param {string} params.actorRole
 * @param {string} params.action
 * @param {string} params.resourceType
 * @param {string} params.resourceId
 * @param {object} [params.metadata]
 */
const logAction = async ({
  actorId,
  actorRole = 'INSTRUCTOR',
  action,
  resourceType,
  resourceId,
  metadata = {},
}) => {
  try {
    if (!actorId || !action || !resourceType || !resourceId) {
      return;
    }

    await AuditLog.create({
      actorId,
      actorRole,
      action,
      resourceType,
      resourceId,
      metadata,
      timestamp: new Date(),
    });
  } catch (error) {
    console.error('[AuditLog] Failed to persist audit log:', error.message);
  }
};

module.exports = {
  logAction,
};
