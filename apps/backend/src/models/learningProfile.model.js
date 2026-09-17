const mongoose = require('mongoose');

const MASTERY_LEVELS = [
  'NOT_STARTED',
  'INTRODUCED',
  'PRACTICING',
  'DEVELOPING',
  'PROFICIENT',
  'REVIEW_RECOMMENDED',
];

const topicMasterySchema = new mongoose.Schema(
  {
    topic: { type: String, required: true },
    courseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Course', default: null },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    attemptsCount: { type: Number, default: 0 },
    mistakesCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ['STRONG', 'NEEDS_PRACTICE', 'NORMAL'],
      default: 'NORMAL',
    },
    lastAssessedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const skillMasterySchema = new mongoose.Schema(
  {
    skillId: { type: mongoose.Schema.Types.ObjectId, ref: 'Skill', required: true },
    skillName: { type: String, required: true },
    level: {
      type: String,
      enum: MASTERY_LEVELS,
      default: 'NOT_STARTED',
    },
    practiceCount: { type: Number, default: 0 },
    assessmentCount: { type: Number, default: 0 },
    codingCount: { type: Number, default: 0 },
    lastPracticedAt: { type: Date, default: null },
  },
  { _id: false }
);

const learningProfileSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    skills: {
      type: [skillMasterySchema],
      default: [],
    },
    topics: {
      type: [topicMasterySchema],
      default: [],
    },
    weakTopics: [
      {
        topic: { type: String, required: true },
        reason: { type: String, default: 'Needs more practice' },
        mistakesCount: { type: Number, default: 0 },
        accuracy: { type: Number, default: 0 },
        lastTestedAt: { type: Date, default: Date.now },
      },
    ],
    strongTopics: [
      {
        topic: { type: String, required: true },
        accuracy: { type: Number, default: 0 },
        successfulCount: { type: Number, default: 0 },
        lastPracticedAt: { type: Date, default: Date.now },
      },
    ],
    assessmentStats: {
      quizzesTaken: { type: Number, default: 0 },
      quizzesPassed: { type: Number, default: 0 },
      averageScore: { type: Number, default: 0 },
      lastAssessmentAt: { type: Date, default: null },
    },
    codingStats: {
      problemsAttempted: { type: Number, default: 0 },
      problemsSolved: { type: Number, default: 0 },
      acceptedSubmissions: { type: Number, default: 0 },
      lastProblemAt: { type: Date, default: null },
    },
    learningVelocity: {
      lessonsCompletedThisWeek: { type: Number, default: 0 },
      questionsAnsweredThisWeek: { type: Number, default: 0 },
      codingProblemsThisWeek: { type: Number, default: 0 },
      estimatedMinutesThisWeek: { type: Number, default: 0 },
      currentStreakDays: { type: Number, default: 0 },
      longestStreakDays: { type: Number, default: 0 },
      lastActiveDate: { type: String, default: null }, // YYYY-MM-DD
    },
    preferences: {
      personalizedRecommendations: { type: Boolean, default: true },
      aiTutorContext: { type: Boolean, default: true },
      learningReminders: { type: Boolean, default: true },
      reminderFrequency: {
        type: String,
        enum: ['IMMEDIATE', 'DAILY', 'WEEKLY', 'OFF'],
        default: 'DAILY',
      },
      weeklyReview: { type: Boolean, default: true },
      adaptivePractice: { type: Boolean, default: true },
    },
    lastAnalyzedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

learningProfileSchema.index({ studentId: 1 }, { unique: true });

const LearningProfile = mongoose.model('LearningProfile', learningProfileSchema);

module.exports = {
  LearningProfile,
  MASTERY_LEVELS,
};
