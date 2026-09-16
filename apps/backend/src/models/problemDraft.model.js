const mongoose = require('mongoose');

const problemDraftSchema = new mongoose.Schema(
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
    language: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      maxlength: [100000, 'Code draft exceeds maximum size of 100KB'],
    },
  },
  {
    timestamps: true,
  }
);

problemDraftSchema.index({ studentId: 1, problemId: 1, language: 1 }, { unique: true });

const ProblemDraft = mongoose.model('ProblemDraft', problemDraftSchema);

module.exports = { ProblemDraft };
