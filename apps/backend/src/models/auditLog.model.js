const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    actorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    actorRole: {
      type: String,
      enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN', 'SYSTEM'],
      required: true,
    },
    action: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      required: true,
      enum: [
        'COURSE',
        'MODULE',
        'LESSON',
        'RESOURCE',
        'ASSESSMENT',
        'QUESTION',
        'PROBLEM',
        'TEST_CASE',
        'ASSIGNMENT',
        'USER',
        'INSTRUCTOR',
        'STUDENT',
        'REPORT',
        'CATEGORY',
        'SETTINGS',
        'FEATURE_FLAG',
        'ANNOUNCEMENT',
        'ADMIN',
        'SYSTEM',
      ],
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
      index: true,
    },
    result: {
      type: String,
      enum: ['SUCCESS', 'FAILURE'],
      default: 'SUCCESS',
      index: true,
    },
    ipAddress: {
      type: String,
      default: null,
    },
    userAgent: {
      type: String,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

auditLogSchema.index({ actorId: 1, timestamp: -1 });
auditLogSchema.index({ resourceType: 1, resourceId: 1, timestamp: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

module.exports = AuditLog;
