const mongoose = require('mongoose');

const coverLetterSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    jobId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Job',
      default: null,
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resume',
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Cover letter title is required'],
      trim: true,
    },
    content: {
      type: String,
      required: [true, 'Cover letter content is required'],
    },
    version: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

const CoverLetter = mongoose.models.CoverLetter || mongoose.model('CoverLetter', coverLetterSchema);

module.exports = CoverLetter;
