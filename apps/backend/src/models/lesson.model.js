const mongoose = require('mongoose');

const LESSON_TYPES = ['VIDEO', 'ARTICLE', 'READING', 'RESOURCE'];

const resourceSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    url: { type: String, required: true },
    type: { type: String, default: 'LINK' },
  },
  { _id: false }
);

const lessonSchema = new mongoose.Schema(
  {
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID is required'],
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: [true, 'Module ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Lesson slug is required'],
      trim: true,
      lowercase: true,
    },
    description: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: LESSON_TYPES,
      default: 'VIDEO',
    },
    order: {
      type: Number,
      required: [true, 'Order is required'],
      default: 1,
    },
    duration: {
      type: Number, // Duration in minutes
      default: 15,
    },
    videoUrl: {
      type: String,
      default: null,
    },
    content: {
      type: String, // Rich text or article markdown
      default: '',
    },
    resources: {
      type: [resourceSchema],
      default: [],
    },
    isPreview: {
      type: Boolean,
      default: false,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
    workspace: {
      enabled: { type: Boolean, default: false },
      type: {
        type: String,
        enum: [
          'NONE',
          'CODE_RUNNER',
          'CLOUD_IDE',
          'DATABASE_LAB',
          'DATA_SCIENCE_LAB',
          'DEEP_LEARNING_LAB',
          'GENAI_LAB',
        ],
        default: 'NONE',
      },
      templateId: { type: String, default: null },
      templateVersion: { type: String, default: '1.0' },
      hardware: { type: String, enum: ['cpu', 'gpu'], default: 'cpu' },
      starterFiles: { type: Array, default: [] },
      tests: { type: Array, default: [] },
      resourceProfile: { type: String, enum: ['BASIC', 'STANDARD', 'ML', 'GPU'], default: 'STANDARD' },
      inactivityTimeoutMinutes: { type: Number, default: 30 },
    },
  },
  {
    timestamps: true,
  }
);

// Auto-generate slug and fallback moduleId if not provided
lessonSchema.pre('validate', function (next) {
  if (!this.slug && this.title) {
    this.slug =
      this.title
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '') || `lesson-${Date.now()}`;
  }
  if (!this.moduleId) {
    this.moduleId = new mongoose.Types.ObjectId();
  }
  next();
});

// Compound indexes for sequential ordering and retrieval
lessonSchema.index({ courseId: 1, moduleId: 1, order: 1 });
lessonSchema.index({ courseId: 1, order: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);

module.exports = {
  Lesson,
  LESSON_TYPES,
};
