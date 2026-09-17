const mongoose = require('mongoose');

const FEEDBACK_TARGET_TYPES = ['COURSE', 'LESSON', 'ASSESSMENT', 'PROJECT', 'INTERVIEW', 'AI_TUTOR', 'PLATFORM'];
const FEEDBACK_CATEGORIES = ['CONTENT_QUALITY', 'DIFFICULTY', 'UX', 'BUG', 'SUGGESTION', 'GENERAL'];

const feedbackSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    userRole: {
      type: String,
      enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'EMPLOYER'],
      default: 'STUDENT',
    },
    targetType: {
      type: String,
      enum: FEEDBACK_TARGET_TYPES,
      required: true,
      index: true,
    },
    targetId: {
      type: String,
      required: true,
      index: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    category: {
      type: String,
      enum: FEEDBACK_CATEGORIES,
      default: 'GENERAL',
      index: true,
    },
    feedbackText: {
      type: String,
      required: [true, 'Feedback text is required'],
      trim: true,
      maxlength: 1000,
    },
    sentiment: {
      type: String,
      enum: ['POSITIVE', 'NEUTRAL', 'NEGATIVE'],
      default: 'NEUTRAL',
    },
  },
  {
    timestamps: true,
  }
);

feedbackSchema.index({ targetType: 1, targetId: 1, createdAt: -1 });

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

module.exports = {
  Feedback,
  FEEDBACK_TARGET_TYPES,
  FEEDBACK_CATEGORIES,
};
