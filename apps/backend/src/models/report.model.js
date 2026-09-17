const mongoose = require('mongoose');

const REPORT_STATUSES = ['OPEN', 'INVESTIGATING', 'RESOLVED', 'DISMISSED'];
const TARGET_TYPES = [
  'COURSE',
  'LESSON',
  'QUESTION',
  'PROBLEM',
  'USER',
  'INSTRUCTOR',
  'STUDENT',
  'ASSESSMENT',
  'SYSTEM',
];

const reportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    targetType: {
      type: String,
      enum: TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
      index: true,
    },
    reason: {
      type: String,
      required: true,
      enum: [
        'INCORRECT_INFORMATION',
        'BROKEN_CONTENT',
        'INAPPROPRIATE_CONTENT',
        'COPYRIGHT_CONCERN',
        'SPAM',
        'SECURITY_ISSUE',
        'OTHER',
      ],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
    status: {
      type: String,
      enum: REPORT_STATUSES,
      default: 'OPEN',
      index: true,
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
      index: true,
    },
    resolution: {
      actionTaken: { type: String, default: null },
      notes: { type: String, default: null },
      resolvedAt: { type: Date, default: null },
      resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    },
  },
  {
    timestamps: true,
  }
);

reportSchema.index({ status: 1, createdAt: -1 });

const Report = mongoose.model('Report', reportSchema);

module.exports = {
  Report,
  REPORT_STATUSES,
  TARGET_TYPES,
};
