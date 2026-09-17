const mongoose = require('mongoose');

const studyTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: {
      type: String,
      enum: ['LESSON', 'QUIZ', 'CODING', 'REVISION', 'AI_TUTOR'],
      required: true,
    },
    resourceType: {
      type: String,
      enum: ['Course', 'Lesson', 'Assessment', 'Problem', 'Topic'],
      default: 'Lesson',
    },
    resourceId: { type: mongoose.Schema.Types.Mixed, default: null },
    slug: { type: String, default: null },
    estimatedDuration: { type: Number, required: true }, // in minutes
    completed: { type: Boolean, default: false },
    completedAt: { type: Date, default: null },
  },
  { _id: true }
);

const studyPlanSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: true,
      index: true,
    },
    tasks: {
      type: [studyTaskSchema],
      default: [],
    },
    estimatedDuration: {
      type: Number, // total minutes
      default: 0,
    },
    completedTasks: {
      type: Number,
      default: 0,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'SKIPPED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

studyPlanSchema.index({ studentId: 1, date: 1 }, { unique: true });

const StudyPlan = mongoose.model('StudyPlan', studyPlanSchema);

module.exports = StudyPlan;
