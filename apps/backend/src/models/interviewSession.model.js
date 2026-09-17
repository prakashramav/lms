const mongoose = require('mongoose');

const interviewSessionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    role: {
      type: String,
      default: 'Full Stack Developer',
    },
    category: {
      type: String,
      enum: ['TECHNICAL', 'HR', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'MOCK_ALL'],
      default: 'TECHNICAL',
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    questions: [
      {
        questionId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'InterviewQuestion',
        },
        question: { type: String, required: true },
        category: { type: String, default: 'TECHNICAL' },
        studentAnswer: { type: String, default: '' },
        feedback: {
          relevance: { type: Number, default: 0 },
          structure: { type: Number, default: 0 },
          clarity: { type: Number, default: 0 },
          technicalCoverage: { type: Number, default: 0 },
          strengths: [{ type: String }],
          missingConcepts: [{ type: String }],
          suggestions: { type: String, default: '' },
        },
        score: { type: Number, default: 0 },
        answeredAt: { type: Date },
      },
    ],
    currentQuestionIndex: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['IN_PROGRESS', 'COMPLETED', 'ABANDONED'],
      default: 'IN_PROGRESS',
      index: true,
    },
    overallScore: {
      type: Number,
      default: 0,
    },
    overallFeedback: {
      type: String,
      default: '',
    },
    duration: {
      type: Number, // in seconds
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

interviewSessionSchema.index({ studentId: 1, status: 1, createdAt: -1 });

const InterviewSession = mongoose.models.InterviewSession || mongoose.model('InterviewSession', interviewSessionSchema);

module.exports = InterviewSession;
