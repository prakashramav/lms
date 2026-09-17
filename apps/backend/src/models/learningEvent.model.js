const mongoose = require('mongoose');

const EVENT_TYPES = [
  'LESSON_STARTED',
  'LESSON_COMPLETED',
  'QUIZ_STARTED',
  'QUIZ_SUBMITTED',
  'CODING_ATTEMPTED',
  'CODING_SOLVED',
  'AI_SESSION',
  'RESOURCE_VIEWED',
  'GOAL_COMPLETED',
  'REVIEW_COMPLETED',
];

const learningEventSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    eventType: {
      type: String,
      enum: EVENT_TYPES,
      required: true,
      index: true,
    },
    resourceType: {
      type: String,
      enum: ['Course', 'Module', 'Lesson', 'Assessment', 'Problem', 'Goal', 'Topic', 'AI'],
      default: 'Lesson',
    },
    resourceId: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    timestamp: {
      type: Date,
      default: Date.now,
      index: true,
    },
    eventId: {
      type: String,
      sparse: true,
      unique: true,
    },
  },
  {
    timestamps: false,
    versionKey: false,
  }
);

learningEventSchema.index({ studentId: 1, timestamp: -1 });
learningEventSchema.index({ studentId: 1, eventType: 1, timestamp: -1 });

const LearningEvent = mongoose.model('LearningEvent', learningEventSchema);

module.exports = {
  LearningEvent,
  EVENT_TYPES,
};
