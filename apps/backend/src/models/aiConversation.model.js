const mongoose = require('mongoose');

const LEARNING_MODES = ['GUIDED', 'DIRECT', 'EXPLANATION'];

const aiConversationSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    title: {
      type: String,
      default: 'New Learning Chat',
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },
    mode: {
      type: String,
      enum: LEARNING_MODES,
      default: 'GUIDED',
    },
    context: {
      courseId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        default: null,
      },
      moduleId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Module',
        default: null,
      },
      lessonId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Lesson',
        default: null,
      },
      problemId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Problem',
        default: null,
      },
      assessmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Assessment',
        default: null,
      },
      language: {
        type: String,
        default: null,
      },
      metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {},
      },
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

aiConversationSchema.index({ studentId: 1, updatedAt: -1 });

const AIConversation = mongoose.model('AIConversation', aiConversationSchema);

module.exports = {
  AIConversation,
  LEARNING_MODES,
};
