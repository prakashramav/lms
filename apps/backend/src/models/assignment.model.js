const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },
    description: {
      type: String,
      default: '',
    },
    instructions: {
      type: String,
      default: '',
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course reference is required'],
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
      index: true,
    },
    dueDate: {
      type: Date,
      default: null,
    },
    totalMarks: {
      type: Number,
      default: 100,
      min: 1,
    },
    allowedAttempts: {
      type: Number,
      default: 1,
      min: 1,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    codingProblems: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
      },
    ],
    version: {
      type: String,
      default: '1.0',
    },
    workspace: {
      enabled: { type: Boolean, default: false },
      type: {
        type: String,
        enum: [
          'NONE',
          'CODE_RUNNER',
          'CLOUD_IDE',
          'DATABASE_LAB',
          'DATA_SCIENCE_LAB',
          'DEEP_LEARNING_LAB',
          'GENAI_LAB',
        ],
        default: 'NONE',
      },
      templateId: { type: String, default: null },
      templateVersion: { type: String, default: '1.0' },
      starterFiles: { type: Array, default: [] },
      tests: { type: Array, default: [] },
      resourceProfile: { type: String, enum: ['BASIC', 'STANDARD', 'ML', 'GPU'], default: 'STANDARD' },
      gradingPolicy: {
        type: String,
        enum: ['AUTO', 'MANUAL', 'HYBRID', 'PRACTICE'],
        default: 'AUTO',
      },
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

assignmentSchema.index({ courseId: 1, status: 1 });

const Assignment = mongoose.model('Assignment', assignmentSchema);

module.exports = Assignment;
