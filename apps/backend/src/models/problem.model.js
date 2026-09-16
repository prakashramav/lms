const mongoose = require('mongoose');

const problemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Problem title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Problem slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: [true, 'Problem description is required'],
    },
    category: {
      type: String,
      enum: ['JAVASCRIPT', 'HTML_CSS', 'REACT', 'NODE', 'EXPRESS'],
      required: [true, 'Problem category is required'],
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['EASY', 'MEDIUM', 'HARD'],
      required: [true, 'Difficulty level is required'],
      index: true,
    },
    topics: [
      {
        type: String,
        trim: true,
        index: true,
      },
    ],
    supportedLanguages: [
      {
        type: String,
        enum: ['javascript', 'html_css', 'react', 'node', 'express', 'python', 'java', 'cpp', 'typescript'],
        required: true,
      },
    ],
    starterCode: {
      type: Map,
      of: String,
      default: {},
    },
    functionSignature: {
      name: { type: String },
      params: [
        {
          name: { type: String },
          type: { type: String },
        },
      ],
      returnType: { type: String },
    },
    inputFormat: {
      type: String,
      default: '',
    },
    outputFormat: {
      type: String,
      default: '',
    },
    constraints: [
      {
        type: String,
      },
    ],
    examples: [
      {
        input: { type: String, required: true },
        output: { type: String, required: true },
        explanation: { type: String },
      },
    ],
    hints: [
      {
        type: String,
      },
    ],
    solutionExplanation: {
      type: String,
      default: '',
    },
    isPublished: {
      type: Boolean,
      default: true,
      index: true,
    },
    totalSubmissions: {
      type: Number,
      default: 0,
    },
    acceptedSubmissions: {
      type: Number,
      default: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for public test cases
problemSchema.virtual('publicTestCases', {
  ref: 'TestCase',
  localField: '_id',
  foreignField: 'problemId',
  match: { isHidden: false },
});

problemSchema.index({ difficulty: 1, isPublished: 1 });
problemSchema.index({ category: 1, isPublished: 1 });
problemSchema.index({ topics: 1, isPublished: 1 });
problemSchema.index({ createdAt: -1 });

const Problem = mongoose.model('Problem', problemSchema);

module.exports = { Problem };
