const mongoose = require('mongoose');

const jobMatchSchema = new mongoose.Schema(
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
    matchingSignals: [
      {
        type: String,
      },
    ],
    missingSkills: [
      {
        type: String,
      },
    ],
    matchScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
  },
  {
    timestamps: true,
  }
);

jobMatchSchema.index({ studentId: 1, jobId: 1 }, { unique: true });

const JobMatch = mongoose.models.JobMatch || mongoose.model('JobMatch', jobMatchSchema);

module.exports = JobMatch;
