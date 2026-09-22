const mongoose = require('mongoose');

const cohortSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Cohort name is required'],
      trim: true,
    },
    code: {
      type: String,
      required: [true, 'Cohort code is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      default: null,
      index: true,
    },
    track: {
      type: String,
      enum: [
        'FRONTEND',
        'BACKEND',
        'FULLSTACK',
        'DATA_SCIENCE',
        'AI_ENGINEERING',
        'DEVOPS',
        'GENERAL',
      ],
      default: 'GENERAL',
      index: true,
    },
    instructors: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    students: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    startDate: {
      type: Date,
      default: Date.now,
    },
    endDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['UPCOMING', 'ACTIVE', 'COMPLETED', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    metrics: {
      averageProgress: { type: Number, default: 0, min: 0, max: 100 },
      completionRate: { type: Number, default: 0, min: 0, max: 100 },
      activeStudentsCount: { type: Number, default: 0 },
      lastCalculatedAt: { type: Date, default: Date.now },
    },
  },
  {
    timestamps: true,
  }
);

cohortSchema.index({ organizationId: 1, status: 1 });

const Cohort = mongoose.model('Cohort', cohortSchema);

module.exports = Cohort;
