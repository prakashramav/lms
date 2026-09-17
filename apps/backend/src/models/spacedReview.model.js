const mongoose = require('mongoose');

const spacedReviewSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    topic: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['Lesson', 'Assessment', 'Problem', 'Topic'],
      default: 'Topic',
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    slug: {
      type: String,
      default: null,
    },
    performanceScore: {
      type: Number, // 0 - 100 percentage
      default: 50,
    },
    lastReviewed: {
      type: Date,
      default: Date.now,
    },
    nextReview: {
      type: Date,
      required: true,
      index: true,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    intervalDays: {
      type: Number,
      default: 1, // 1 -> 3 -> 7 -> 14 -> 30 days
    },
    status: {
      type: String,
      enum: ['DUE', 'REVIEWED', 'MASTERED'],
      default: 'DUE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

spacedReviewSchema.index({ studentId: 1, nextReview: 1 });
spacedReviewSchema.index({ studentId: 1, topic: 1 }, { unique: true });

const SpacedReview = mongoose.model('SpacedReview', spacedReviewSchema);

module.exports = SpacedReview;
