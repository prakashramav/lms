const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    language: {
      type: String,
      required: true,
      enum: ['javascript', 'html_css', 'react', 'node', 'express', 'python', 'java', 'cpp', 'typescript'],
    },
    code: {
      type: String,
      required: true,
      maxlength: [100000, 'Code exceeds maximum size of 100KB'],
    },
    status: {
      type: String,
      enum: ['QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'],
      default: 'QUEUED',
      index: true,
    },
    verdict: {
      type: String,
      enum: [
        'ACCEPTED',
        'WRONG_ANSWER',
        'COMPILE_ERROR',
        'RUNTIME_ERROR',
        'TIME_LIMIT_EXCEEDED',
        'MEMORY_LIMIT_EXCEEDED',
        'SYSTEM_ERROR',
        'PARTIAL_SUCCESS',
      ],
      default: 'ACCEPTED',
      index: true,
    },
    score: {
      type: Number,
      default: 0,
    },
    passedTests: {
      type: Number,
      default: 0,
    },
    totalTests: {
      type: Number,
      default: 0,
    },
    executionTime: {
      type: Number, // milliseconds
      default: 0,
    },
    memoryUsed: {
      type: Number, // KB
      default: 0,
    },
    testResults: [
      {
        testCaseId: { type: mongoose.Schema.Types.ObjectId },
        passed: { type: Boolean, required: true },
        isHidden: { type: Boolean, default: false },
        input: { type: String }, // sanitized: omitted or masked if isHidden is true
        expectedOutput: { type: String }, // sanitized: omitted or masked if isHidden is true
        actualOutput: { type: String },
        errorMessage: { type: String },
        executionTime: { type: Number },
      },
    ],
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

submissionSchema.index({ studentId: 1, createdAt: -1 });
submissionSchema.index({ studentId: 1, problemId: 1, createdAt: -1 });
submissionSchema.index({ problemId: 1, createdAt: -1 });
submissionSchema.index({ studentId: 1, verdict: 1 });

const Submission = mongoose.model('Submission', submissionSchema);

module.exports = { Submission };
