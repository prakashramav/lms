const mongoose = require('mongoose');

const problemBookmarkSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

problemBookmarkSchema.index({ studentId: 1, problemId: 1 }, { unique: true });
problemBookmarkSchema.index({ studentId: 1, createdAt: -1 });

const ProblemBookmark = mongoose.model('ProblemBookmark', problemBookmarkSchema);

module.exports = { ProblemBookmark };
