const mongoose = require('mongoose');

const jobAlertSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    keywords: [
      {
        type: String,
        trim: true,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      default: '',
    },
    remoteType: {
      type: String,
      enum: ['ANY', 'REMOTE', 'HYBRID', 'ONSITE'],
      default: 'ANY',
    },
    frequency: {
      type: String,
      enum: ['DAILY', 'WEEKLY', 'OFF'],
      default: 'WEEKLY',
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    lastSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const JobAlert = mongoose.models.JobAlert || mongoose.model('JobAlert', jobAlertSchema);

module.exports = JobAlert;
