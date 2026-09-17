const AuditLog = require('../../models/auditLog.model');

class AdminAuditService {
  /**
   * Append-only recorder for administrative and operational actions
   */
  async recordAction({
    actor,
    action,
    resourceType,
    resourceId = null,
    metadata = {},
    req = null,
    result = 'SUCCESS',
  }) {
    try {
      const ipAddress = req ? req.ip || req.connection?.remoteAddress || req.headers['x-forwarded-for'] : null;
      const userAgent = req ? req.headers['user-agent'] : null;

      const logEntry = await AuditLog.create({
        actorId: actor._id || actor.id,
        actorRole: actor.role || 'ADMIN',
        action: action.toUpperCase(),
        resourceType,
        resourceId,
        result,
        ipAddress: ipAddress ? String(ipAddress).slice(0, 50) : null,
        userAgent: userAgent ? String(userAgent).slice(0, 250) : null,
        metadata,
        timestamp: new Date(),
      });

      return logEntry;
    } catch (err) {
      // Do not crash main request if audit logging encounters a database hiccup, but output to error stream
      console.error('[AdminAuditService] Failed to record audit log:', err.message);
      return null;
    }
  }

  /**
   * Paginated audit log retrieval with granular filtering
   */
  async getAuditLogs({
    page = 1,
    limit = 20,
    actorId,
    action,
    resourceType,
    result,
    startDate,
    endDate,
  } = {}) {
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const query = {};

    if (actorId) query.actorId = actorId;
    if (action) query.action = new RegExp(`^${action}$`, 'i');
    if (resourceType) query.resourceType = resourceType;
    if (result) query.result = result.toUpperCase();

    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      AuditLog.find(query)
        .populate('actorId', 'name email role')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      AuditLog.countDocuments(query),
    ]);

    return {
      logs,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
      },
    };
  }

  /**
   * Format audit records for export (CSV / JSON)
   */
  async exportLogs({ format = 'json', actor, req, ...filters }) {
    const query = {};
    if (filters.action) query.action = new RegExp(`^${filters.action}$`, 'i');
    if (filters.resourceType) query.resourceType = filters.resourceType;
    if (filters.result) query.result = filters.result.toUpperCase();

    const logs = await AuditLog.find(query)
      .populate('actorId', 'name email role')
      .sort({ timestamp: -1 })
      .limit(1000)
      .lean();

    // Log the export event
    await this.recordAction({
      actor,
      action: 'AUDIT_LOGS_EXPORTED',
      resourceType: 'SYSTEM',
      metadata: { format, recordCount: logs.length, filters },
      req,
    });

    if (format === 'csv') {
      const headers = 'ID,Timestamp,ActorName,ActorEmail,ActorRole,Action,ResourceType,Result,IP\n';
      const rows = logs
        .map((l) =>
          [
            l._id,
            new Date(l.timestamp).toISOString(),
            `"${(l.actorId?.name || 'System').replace(/"/g, '""')}"`,
            l.actorId?.email || 'N/A',
            l.actorRole,
            l.action,
            l.resourceType,
            l.result,
            l.ipAddress || 'N/A',
          ].join(',')
        )
        .join('\n');
      return { data: headers + rows, contentType: 'text/csv' };
    }

    return { data: logs, contentType: 'application/json' };
  }
}

module.exports = new AdminAuditService();
