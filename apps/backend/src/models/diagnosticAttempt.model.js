const mongoose = require('mongoose');

const diagnosticResponseSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null,
    },
    questionText: { type: String, required: true },
    skillSlug: { type: String, required: true },
    tier: { type: Number, default: 1 }, // 1: Foundation, 2: Intermediate, 3: Advanced
    selectedAnswer: { type: mongoose.Schema.Types.Mixed, default: null },
    isCorrect: { type: Boolean, default: false },
    answeredAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const diagnosticReportSchema = new mongoose.Schema(
  {
    strongSkills: [{ type: String }],
    developingSkills: [{ type: String }],
    knowledgeGaps: [{ type: String }],
    prerequisiteGaps: [
      {
        skill: { type: String },
        missingPrerequisite: { type: String },
        recommendation: { type: String },
      },
    ],
    overallMasteryPercentage: { type: Number, default: 0 },
    recommendedCurriculum: [
      {
        type: {
          type: String,
          enum: ['LESSON', 'PRACTICE', 'PROJECT', 'REVISION'],
          default: 'LESSON',
        },
        title: { type: String, required: true },
        reason: { type: String, required: true },
        skill: { type: String, required: true },
        url: { type: String, default: '' },
      },
    ],
  },
  { _id: false }
);

const diagnosticAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    track: {
      type: String,
      required: true,
      default: 'FULLSTACK',
      index: true,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    currentTier: {
      type: Number,
      default: 1,
      min: 1,
      max: 3,
    },
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    responses: [diagnosticResponseSchema],
    report: {
      type: diagnosticReportSchema,
      default: null,
    },
    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

diagnosticAttemptSchema.index({ studentId: 1, createdAt: -1 });

const DiagnosticAttempt = mongoose.model('DiagnosticAttempt', diagnosticAttemptSchema);

module.exports = DiagnosticAttempt;
