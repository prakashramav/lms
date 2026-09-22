const mongoose = require('mongoose');

const mistakeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    sourceType: {
      type: String,
      enum: ['ASSESSMENT', 'CODING'],
      required: true,
      index: true,
    },
    sourceId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Question',
      default: null,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    skillSlug: {
      type: String,
      default: null,
      trim: true,
      index: true,
    },
    skillId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Skill',
      default: null,
      index: true,
    },
    mistakeType: {
      type: String,
      enum: [
        'CONCEPTUAL',
        'SYNTAX_ERROR',
        'LOGICAL_ERROR',
        'TIMEOUT',
        'INCORRECT_CHOICE',
        'EDGE_CASE',
        'CONCEPT',
        'SYNTAX',
        'LOGIC',
        'CARELESS',
        'KNOWLEDGE_GAP',
        'MISUNDERSTANDING',
      ],
      default: 'INCORRECT_CHOICE',
    },
    categoryConfidence: {
      type: String,
      enum: ['LOW', 'MEDIUM', 'HIGH'],
      default: 'MEDIUM',
    },
    categoryEvidence: {
      type: String,
      default: '',
    },
    repetitionCount: {
      type: Number,
      default: 1,
    },
    promptSnippet: {
      type: String,
      default: '',
    },
    studentAnswer: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    correctAnswerReference: {
      type: String,
      default: null,
    },
    explanation: {
      type: String,
      default: '',
    },
    resolved: {
      type: Boolean,
      default: false,
      index: true,
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
    retryCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

mistakeSchema.index({ studentId: 1, resolved: 1, createdAt: -1 });

const Mistake = mongoose.model('Mistake', mistakeSchema);

module.exports = Mistake;
