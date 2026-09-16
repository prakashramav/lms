const mongoose = require('mongoose');

const testCaseSchema = new mongoose.Schema(
  {
    problemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      required: true,
      index: true,
    },
    input: {
      type: String,
      required: true,
    },
    expectedOutput: {
      type: String,
      required: true,
    },
    isHidden: {
      type: Boolean,
      default: false,
      index: true,
    },
    weight: {
      type: Number,
      default: 1,
    },
    order: {
      type: Number,
      default: 0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

testCaseSchema.index({ problemId: 1, order: 1 });
testCaseSchema.index({ problemId: 1, isHidden: 1 });

const TestCase = mongoose.model('TestCase', testCaseSchema);

module.exports = { TestCase };
