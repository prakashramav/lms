const mongoose = require('mongoose');

const ANNOUNCEMENT_AUDIENCES = ['ALL', 'STUDENTS', 'INSTRUCTORS', 'COURSE'];
const ANNOUNCEMENT_STATUSES = ['DRAFT', 'PUBLISHED', 'EXPIRED', 'ARCHIVED'];

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
      maxlength: 200,
    },
    message: {
      type: String,
      required: [true, 'Announcement message is required'],
      trim: true,
      maxlength: 5000,
    },
    audience: {
      type: String,
      enum: ANNOUNCEMENT_AUDIENCES,
      default: 'ALL',
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
    },
    priority: {
      type: String,
      enum: ['LOW', 'NORMAL', 'HIGH', 'CRITICAL'],
      default: 'NORMAL',
    },
    status: {
      type: String,
      enum: ANNOUNCEMENT_STATUSES,
      default: 'PUBLISHED',
      index: true,
    },
    scheduledAt: {
      type: Date,
      default: Date.now,
    },
    expiresAt: {
      type: Date,
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

announcementSchema.index({ status: 1, scheduledAt: -1 });

const Announcement = mongoose.model('Announcement', announcementSchema);

module.exports = {
  Announcement,
  ANNOUNCEMENT_AUDIENCES,
  ANNOUNCEMENT_STATUSES,
};
