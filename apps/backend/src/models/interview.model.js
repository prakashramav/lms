const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    applicationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'JobApplication',
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['SCREENING', 'TECHNICAL', 'HR', 'BEHAVIORAL', 'FINAL'],
      default: 'TECHNICAL',
    },
    scheduledAt: {
      type: Date,
      required: true,
      index: true,
    },
    duration: {
      type: Number, // in minutes
      default: 45,
    },
    meetingLink: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['SCHEDULED', 'COMPLETED', 'CANCELLED'],
      default: 'SCHEDULED',
      index: true,
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

interviewSchema.index({ studentId: 1, scheduledAt: 1 });

const Interview = mongoose.models.Interview || mongoose.model('Interview', interviewSchema);

module.exports = Interview;
