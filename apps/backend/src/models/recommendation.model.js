const mongoose = require('mongoose');

const RECOMMENDATION_TYPES = [
  'CONTINUE_LESSON',
  'REVIEW_TOPIC',
  'PRACTICE_QUIZ',
  'PRACTICE_PROBLEM',
  'PREREQUISITE_LESSON',
  'READ_RESOURCE',
  'AI_TUTOR_SESSION',
  'START_MODULE',
];

const recommendationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: RECOMMENDATION_TYPES,
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    reason: {
      type: String,
      required: true,
      trim: true,
    },
    resourceType: {
      type: String,
      enum: ['Course', 'Lesson', 'Assessment', 'Problem', 'Topic'],
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    slug: {
      type: String,
      default: null,
    },
    priority: {
      type: Number, // 1 - 100 (highest priority on top)
      default: 50,
      index: true,
    },
    estimatedTime: {
      type: Number, // in minutes
      default: 15,
    },
    status: {
      type: String,
      enum: ['PENDING', 'CLICKED', 'COMPLETED', 'DISMISSED'],
      default: 'PENDING',
      index: true,
    },
    feedback: {
      type: String,
      enum: ['HELPFUL', 'NOT_HELPFUL', 'NOT_RELEVANT', 'NONE'],
      default: 'NONE',
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

recommendationSchema.index({ studentId: 1, status: 1, priority: -1 });

const Recommendation = mongoose.model('Recommendation', recommendationSchema);

module.exports = {
  Recommendation,
  RECOMMENDATION_TYPES,
};
