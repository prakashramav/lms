const mongoose = require('mongoose');

const interviewQuestionSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Interview question text is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['HR', 'TECHNICAL', 'BEHAVIORAL', 'SYSTEM_DESIGN', 'CODING', 'ROLE_SPECIFIC'],
      default: 'TECHNICAL',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
      index: true,
    },
    role: {
      type: String,
      default: 'Full Stack Developer',
      index: true,
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    expectedTopics: [
      {
        type: String,
      },
    ],
    explanation: {
      type: String,
      default: '',
    },
    codingProblemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Problem',
      default: null,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'ARCHIVED'],
      default: 'ACTIVE',
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

interviewQuestionSchema.index({ category: 1, difficulty: 1, role: 1 });

const InterviewQuestion = mongoose.models.InterviewQuestion || mongoose.model('InterviewQuestion', interviewQuestionSchema);

module.exports = InterviewQuestion;
