const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema(
  {
    certificateId: {
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
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
      index: true,
    },
    studentName: {
      type: String,
      required: true,
      trim: true,
    },
    courseTitle: {
      type: String,
      required: true,
      trim: true,
    },
    issueDate: {
      type: Date,
      default: Date.now,
    },
    completionScore: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    skillsEarned: [
      {
        type: String,
        trim: true,
      },
    ],
    verificationUrl: {
      type: String,
      required: true,
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

certificateSchema.index({ studentId: 1, courseId: 1 }, { unique: true });
certificateSchema.index({ issueDate: -1 });

const Certificate = mongoose.models.Certificate || mongoose.model('Certificate', certificateSchema);

module.exports = Certificate;
