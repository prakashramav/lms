const mongoose = require('mongoose');

const DOCUMENT_TYPES = ['COURSE', 'LESSON', 'PROBLEM', 'ASSESSMENT_TOPIC'];

const vectorChunkSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      enum: DOCUMENT_TYPES,
      required: true,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
      index: true,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    content: {
      type: String,
      required: true,
    },
    tokensCount: {
      type: Number,
      default: 0,
    },
    embedding: {
      type: [Number],
      default: [],
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

vectorChunkSchema.index({ courseId: 1, moduleId: 1, lessonId: 1 });
vectorChunkSchema.index({ problemId: 1 });

const VectorChunk = mongoose.model('VectorChunk', vectorChunkSchema);

module.exports = {
  VectorChunk,
  DOCUMENT_TYPES,
};
