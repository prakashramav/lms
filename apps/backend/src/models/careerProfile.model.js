const mongoose = require('mongoose');

const careerProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    careerPathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareerPath',
      default: null,
    },
    targetRole: {
      type: String,
      default: '',
    },
    skills: [
      {
        name: { type: String, required: true },
        masteryLevel: {
          type: String,
          enum: ['NOT_STARTED', 'INTRODUCED', 'PRACTICING', 'DEVELOPING', 'PROFICIENT', 'REVIEW_RECOMMENDED'],
          default: 'INTRODUCED',
        },
        category: { type: String, default: 'GENERAL' },
      },
    ],
    completedCourses: {
      type: Number,
      default: 0,
    },
    projects: {
      type: Number,
      default: 0,
    },
    codingStats: {
      attempted: { type: Number, default: 0 },
      solved: { type: Number, default: 0 },
    },
    assessmentStats: {
      taken: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
    },
    resumeStatus: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
    portfolioStatus: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'],
      default: 'NOT_STARTED',
    },
    interviewPrepStatus: {
      type: String,
      enum: ['NOT_STARTED', 'IN_PROGRESS', 'PRACTICED'],
      default: 'NOT_STARTED',
    },
    readinessScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    readinessBreakdown: {
      skills: { type: Number, default: 0 },
      projects: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
      portfolio: { type: Number, default: 0 },
      interview: { type: Number, default: 0 },
    },
    lastCalculatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const CareerProfile = mongoose.models.CareerProfile || mongoose.model('CareerProfile', careerProfileSchema);

module.exports = CareerProfile;
