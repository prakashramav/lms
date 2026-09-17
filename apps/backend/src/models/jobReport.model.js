const mongoose = require('mongoose');

const jobReportSchema = new mongoose.Schema(
  {
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
      index: true,
    },
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    reason: {
      type: String,
      enum: ['SPAM', 'FRAUD', 'INCORRECT_INFO', 'EXPIRED', 'MISLEADING', 'OTHER'],
      required: [true, 'Report reason is required'],
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['PENDING', 'REVIEWED', 'DISMISSED', 'ACTION_TAKEN'],
      default: 'PENDING',
      index: true,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const JobReport = mongoose.models.JobReport || mongoose.model('JobReport', jobReportSchema);

module.exports = JobReport;
