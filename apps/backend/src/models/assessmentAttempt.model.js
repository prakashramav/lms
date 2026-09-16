const mongoose = require('mongoose');

const attemptAnswerSchema = new mongoose.Schema(
  {
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedAnswers: {
      type: [String],
      default: [],
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksAwarded: {
      type: Number,
      default: 0,
    },
    answeredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const assessmentAttemptSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    assessmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assessment',
      required: [true, 'Assessment ID is required'],
      index: true,
    },
    startedAt: {
      type: Date,
      default: Date.now,
    },
    submittedAt: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'SUBMITTED', 'ABANDONED', 'EXPIRED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    percentage: {
      type: Number,
      default: 0,
    },
    passed: {
      type: Boolean,
      default: false,
    },
    totalQuestions: {
      type: Number,
      default: 0,
    },
    answeredQuestions: {
      type: Number,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    incorrectAnswers: {
      type: Number,
      default: 0,
    },
    timeSpent: {
      type: Number, // In seconds
      default: 0,
    },
    attemptNumber: {
      type: Number,
      default: 1,
    },
    answers: [attemptAnswerSchema],
  },
  {
    timestamps: true,
  }
);

// Indexes for fast querying
assessmentAttemptSchema.index({ studentId: 1, assessmentId: 1 });
assessmentAttemptSchema.index({ studentId: 1, createdAt: -1 });
assessmentAttemptSchema.index({ assessmentId: 1, createdAt: -1 });

const AssessmentAttempt = mongoose.model('AssessmentAttempt', assessmentAttemptSchema);

module.exports = AssessmentAttempt;
