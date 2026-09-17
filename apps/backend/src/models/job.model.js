const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company reference is required'],
    },
    description: {
      type: String,
      required: [true, 'Job description is required'],
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    location: {
      type: String,
      default: 'Remote',
      trim: true,
    },
    remoteType: {
      type: String,
      enum: ['REMOTE', 'HYBRID', 'ONSITE'],
      default: 'REMOTE',
    },
    employmentType: {
      type: String,
      enum: ['FULL_TIME', 'PART_TIME', 'INTERNSHIP', 'CONTRACT'],
      default: 'FULL_TIME',
    },
    experienceLevel: {
      type: String,
      enum: ['ENTRY', 'MID', 'SENIOR', 'LEAD'],
      default: 'ENTRY',
    },
    salaryRange: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'USD' },
      period: { type: String, enum: ['HOURLY', 'MONTHLY', 'YEARLY'], default: 'YEARLY' },
    },
    applicationUrl: {
      type: String,
      default: '',
    },
    source: {
      type: String,
      enum: ['PLATFORM', 'EMPLOYER', 'ADMIN', 'EXTERNAL'],
      default: 'PLATFORM',
    },
    externalId: {
      type: String,
      default: '',
    },
    postedAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PENDING_REVIEW', 'PUBLISHED', 'REJECTED', 'EXPIRED', 'ARCHIVED'],
      default: 'PUBLISHED',
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
  }
);

jobSchema.index({ status: 1, postedAt: -1 });
jobSchema.index({ companyId: 1, status: 1 });
jobSchema.index({ remoteType: 1, experienceLevel: 1 });
jobSchema.index({ title: 'text', description: 'text', skills: 'text' });

const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

module.exports = Job;
