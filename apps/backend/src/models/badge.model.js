const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    criteria: {
      type: String, // Machine-evaluable criteria code, e.g. 'FIRST_LESSON', 'STREAK_7', 'COURSE_COMPLETE'
      required: true,
      unique: true,
      index: true,
    },
    icon: {
      type: String,
      default: 'Award', // Lucide icon name
    },
    category: {
      type: String,
      enum: ['LEARNING', 'PRACTICE', 'ASSESSMENT', 'STREAK', 'MASTERY'],
      default: 'LEARNING',
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'INACTIVE'],
      default: 'ACTIVE',
    },
  },
  {
    timestamps: true,
  }
);

const studentAchievementSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      required: true,
      index: true,
    },
    earnedAt: {
      type: Date,
      default: Date.now,
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

studentAchievementSchema.index({ studentId: 1, badgeId: 1 }, { unique: true });

const Badge = mongoose.model('Badge', badgeSchema);
const StudentAchievement = mongoose.model('StudentAchievement', studentAchievementSchema);

module.exports = {
  Badge,
  StudentAchievement,
};
