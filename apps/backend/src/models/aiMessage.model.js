const mongoose = require('mongoose');

const MESSAGE_ROLES = ['USER', 'ASSISTANT', 'SYSTEM'];

const aiMessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AIConversation',
      required: [true, 'Conversation ID is required'],
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Student ID is required'],
      index: true,
    },
    role: {
      type: String,
      enum: MESSAGE_ROLES,
      required: true,
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      maxlength: [10000, 'Content exceeds maximum allowed characters'],
    },
    context: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    tokenUsage: {
      promptTokens: { type: Number, default: 0 },
      completionTokens: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 },
    },
    feedback: {
      rating: {
        type: String,
        enum: ['HELPFUL', 'UNHELPFUL'],
        default: null,
      },
      reason: {
        type: String,
        default: null,
        maxlength: 500,
      },
      submittedAt: {
        type: Date,
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

aiMessageSchema.index({ conversationId: 1, createdAt: 1 });
aiMessageSchema.index({ studentId: 1, createdAt: -1 });

const AIMessage = mongoose.model('AIMessage', aiMessageSchema);

module.exports = {
  AIMessage,
  MESSAGE_ROLES,
};
