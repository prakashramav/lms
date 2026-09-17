const mongoose = require('mongoose');

const SUPPORT_CATEGORIES = ['TECHNICAL', 'COURSE', 'ACCOUNT', 'CAREER', 'BILLING', 'OTHER'];
const SUPPORT_PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'];
const SUPPORT_STATUSES = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

const supportTicketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: 200,
    },
    category: {
      type: String,
      enum: SUPPORT_CATEGORIES,
      default: 'TECHNICAL',
      index: true,
    },
    priority: {
      type: String,
      enum: SUPPORT_PRIORITIES,
      default: 'MEDIUM',
      index: true,
    },
    status: {
      type: String,
      enum: SUPPORT_STATUSES,
      default: 'OPEN',
      index: true,
    },
    messages: [
      {
        senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        senderRole: { type: String, enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SYSTEM'], required: true },
        message: { type: String, required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    aiClassification: {
      suggestedCategory: { type: String, default: null },
      confidence: { type: Number, default: 0 },
      urgencyScore: { type: Number, default: 0 },
      sentiment: { type: String, default: 'NEUTRAL' },
    },
    resolvedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

supportTicketSchema.index({ studentId: 1, status: 1 });
supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });

const SupportTicket = mongoose.models.SupportTicket || mongoose.model('SupportTicket', supportTicketSchema);

module.exports = {
  SupportTicket,
  SUPPORT_CATEGORIES,
  SUPPORT_PRIORITIES,
  SUPPORT_STATUSES,
};
