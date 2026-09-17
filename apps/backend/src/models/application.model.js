const mongoose = require('mongoose');

const APPLICATION_STATUSES = ['SAVED', 'APPLIED', 'SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'];

const ALLOWED_STATUS_TRANSITIONS = {
  SAVED: ['APPLIED', 'WITHDRAWN'],
  APPLIED: ['SCREENING', 'INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
  SCREENING: ['INTERVIEW', 'OFFER', 'REJECTED', 'WITHDRAWN'],
  INTERVIEW: ['OFFER', 'REJECTED', 'WITHDRAWN'],
  OFFER: ['REJECTED', 'WITHDRAWN'],
  REJECTED: ['APPLIED'], // Allows re-evaluation if requested
  WITHDRAWN: ['APPLIED'],
};

const applicationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      required: true,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    coverLetterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CoverLetter',
      default: null,
    },
    status: {
      type: String,
      enum: APPLICATION_STATUSES,
      default: 'APPLIED',
    },
    appliedAt: {
      type: Date,
      default: Date.now,
    },
    lastUpdatedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['PLATFORM', 'EXTERNAL'],
      default: 'PLATFORM',
    },
    externalApplication: {
      type: Boolean,
      default: false,
    },
    timeline: [
      {
        status: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
        note: { type: String, default: '' },
      },
    ],
  },
  {
    timestamps: true,
  }
);

applicationSchema.index({ studentId: 1, jobId: 1 }, { unique: true });
applicationSchema.index({ studentId: 1, status: 1 });
applicationSchema.index({ jobId: 1, status: 1 });

const JobApplication = mongoose.models.JobApplication || mongoose.model('JobApplication', applicationSchema);

module.exports = {
  JobApplication,
  APPLICATION_STATUSES,
  ALLOWED_STATUS_TRANSITIONS,
};
