const mongoose = require('mongoose');

const COURSE_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const COURSE_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'];
const PRICING_TYPES = ['FREE', 'PREMIUM'];

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    shortDescription: {
      type: String,
      required: [true, 'Short description is required'],
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters'],
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    thumbnail: {
      type: String,
      default: '/images/courses/default-thumbnail.jpg',
    },
    banner: {
      type: String,
      default: null,
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      index: true,
    },
    difficulty: {
      type: String,
      enum: COURSE_DIFFICULTIES,
      default: 'BEGINNER',
      index: true,
    },
    skills: {
      type: [String],
      default: [],
    },
    language: {
      type: String,
      default: 'English',
    },
    duration: {
      type: String,
      default: '10 hours',
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Instructor reference is required'],
    },
    status: {
      type: String,
      enum: COURSE_STATUSES,
      default: 'DRAFT',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    featured: {
      type: Boolean,
      default: false,
      index: true,
    },
    pricingType: {
      type: String,
      enum: PRICING_TYPES,
      default: 'FREE',
    },
    requirements: {
      type: [String],
      default: [],
    },
    learningOutcomes: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Compound text index for catalog search
courseSchema.index({
  title: 'text',
  shortDescription: 'text',
  skills: 'text',
  category: 'text',
});

// Virtual populate for modules
courseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'courseId',
  options: { sort: { order: 1 } },
});

const Course = mongoose.model('Course', courseSchema);

module.exports = {
  Course,
  COURSE_DIFFICULTIES,
  COURSE_STATUSES,
  PRICING_TYPES,
};
