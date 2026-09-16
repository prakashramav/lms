const mongoose = require('mongoose');

const assessmentSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      index: true,
      default: null,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      index: true,
      default: null,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      index: true,
      default: null,
    },
    title: {
      type: String,
      required: [true, 'Assessment title is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Assessment slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    instructions: {
      type: String,
      trim: true,
      default: 'Read each question carefully and select the best answer.',
    },
    type: {
      type: String,
      enum: [
        'QUIZ',
        'PRACTICE_TEST',
        'MODULE_ASSESSMENT',
        'COURSE_ASSESSMENT',
        'CODING_ASSESSMENT',
        'PROJECT_ASSESSMENT',
        'INTERVIEW_ASSESSMENT',
      ],
      default: 'QUIZ',
      index: true,
    },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Beginner',
      index: true,
    },
    duration: {
      type: Number, // In minutes
      required: [true, 'Duration in minutes is required'],
      default: 30,
    },
    passingScore: {
      type: Number, // Percentage required to pass
      default: 70,
      min: 0,
      max: 100,
    },
    totalMarks: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number, // 0 = unlimited
      default: 3,
    },
    shuffleQuestions: {
      type: Boolean,
      default: false,
    },
    shuffleOptions: {
      type: Boolean,
      default: false,
    },
    showResultsImmediately: {
      type: Boolean,
      default: true,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'DRAFT',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
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
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual populate for questions
assessmentSchema.virtual('questions', {
  ref: 'Question',
  localField: '_id',
  foreignField: 'assessmentId',
  options: { sort: { order: 1 } },
});

// Auto-sync isPublished boolean with status
assessmentSchema.pre('save', function (next) {
  if (this.isModified('status')) {
    this.isPublished = this.status === 'PUBLISHED';
  }
  next();
});

const Assessment = mongoose.model('Assessment', assessmentSchema);

module.exports = Assessment;
