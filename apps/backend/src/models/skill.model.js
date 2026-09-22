const mongoose = require('mongoose');
const { MASTERY_LEVELS } = require('./learningProfile.model');

const skillSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Skill name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Skill slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      required: true,
      index: true,
      enum: ['FRONTEND', 'BACKEND', 'DATABASE', 'DEVOPS', 'DATA_STRUCTURES', 'ALGORITHMS', 'SYSTEM_DESIGN', 'GENERAL'],
      default: 'GENERAL',
    },
    prerequisites: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    relatedSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'BEGINNER',
    },
    diagnosticTier: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    careerTracks: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  {
    timestamps: true,
  }
);

const evidenceItemSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        'ASSESSMENT',
        'PROJECT',
        'CODE_PRACTICE',
        'INSTRUCTOR_EVALUATION',
        'CERTIFICATION',
        'SELF_REPORTED',
      ],
      required: true,
    },
    provenance: {
      type: String,
      enum: ['OBSERVED', 'INFERRED', 'SELF_REPORTED'],
      default: 'OBSERVED',
    },
    referenceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    score: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: '',
    },
    verifiedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const studentSkillSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      required: true,
      index: true,
    },
    masteryLevel: {
      type: String,
      enum: MASTERY_LEVELS,
      default: 'NOT_STARTED',
      index: true,
    },
    confidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'LOW',
    },
    confidenceScore: {
      type: Number,
      default: 0.1,
      min: 0,
      max: 1.0,
    },
    evidence: {
      type: [evidenceItemSchema],
      default: [],
    },
    // Phase 14: Distinct mastery dimensions
    observedScore: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    selfReportedLevel: {
      type: String,
      enum: ['NONE', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'NONE',
    },
    assessmentBasedLevel: {
      type: String,
      enum: MASTERY_LEVELS,
      default: 'NOT_STARTED',
    },
    aiEstimatedLevel: {
      type: String,
      enum: MASTERY_LEVELS,
      default: 'NOT_STARTED',
    },
    exposureCount: {
      type: Number,
      default: 0,
    },
    practiceCount: {
      type: Number,
      default: 0,
    },
    assessmentScoreAvg: {
      type: Number,
      default: 0,
    },
    codingAccuracy: {
      type: Number,
      default: 0,
    },
    lastPracticedAt: {
      type: Date,
      default: null,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

studentSkillSchema.index({ studentId: 1, skillId: 1 }, { unique: true });

const Skill = mongoose.model('Skill', skillSchema);
const StudentSkill = mongoose.model('StudentSkill', studentSkillSchema);

module.exports = {
  Skill,
  StudentSkill,
};
