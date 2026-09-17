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
  },
  {
    timestamps: true,
  }
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
