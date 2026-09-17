const mongoose = require('mongoose');

const careerPlanSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    careerPathId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'CareerPath',
      default: null,
    },
    targetRole: {
      type: String,
      default: '',
    },
    goals: [
      {
        type: String,
      },
    ],
    milestones: [
      {
        title: { type: String, required: true },
        completed: { type: Boolean, default: false },
        targetDate: { type: Date },
        completedAt: { type: Date },
      },
    ],
    targetDate: {
      type: Date,
    },
    weeklyTime: {
      type: Number, // hours per week
      default: 10,
    },
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'COMPLETED', 'PAUSED'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const CareerPlan = mongoose.models.CareerPlan || mongoose.model('CareerPlan', careerPlanSchema);

module.exports = CareerPlan;
