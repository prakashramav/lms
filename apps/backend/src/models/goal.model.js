const mongoose = require('mongoose');

const GOAL_TYPES = [
  'COURSE_COMPLETION',
  'SKILL',
  'ASSESSMENT',
  'CODING',
  'DAILY_PRACTICE',
];

const GOAL_STATUSES = ['IN_PROGRESS', 'COMPLETED', 'EXPIRED', 'ABANDONED'];

const goalSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: GOAL_TYPES,
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Goal title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    target: {
      type: Number,
      required: true,
      min: 1,
    },
    currentValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    unit: {
      type: String,
      default: 'items', // 'lessons', 'minutes', 'problems', 'score'
    },
    deadline: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: GOAL_STATUSES,
      default: 'IN_PROGRESS',
      index: true,
    },
    completedAt: {
      type: Date,
      default: null,
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

goalSchema.index({ studentId: 1, status: 1 });

const Goal = mongoose.model('Goal', goalSchema);

module.exports = {
  Goal,
  GOAL_TYPES,
  GOAL_STATUSES,
};
