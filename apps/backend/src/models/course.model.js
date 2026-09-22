const mongoose = require('mongoose');

const COURSE_DIFFICULTIES = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];
const COURSE_STATUSES = [
  'DRAFT',
  'PENDING_REVIEW',
  'APPROVED',
  'PUBLISHED',
  'REJECTED',
  'ARCHIVED',
  'SUSPENDED',
];
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
      index: true,
    },
    status: {
      type: String,
      enum: COURSE_STATUSES,
      uppercase: true,
      default: 'DRAFT',
      index: true,
    },
    isPublished: {
      type: Boolean,
      default: false,
      index: true,
    },
    isPublic: {
      type: Boolean,
      default: true,
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
    version: {
      type: Number,
      default: 1,
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    publishedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    publishedByRole: {
      type: String,
      enum: ['instructor', 'admin', 'INSTRUCTOR', 'ADMIN', null],
      default: null,
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    reviewedAt: {
      type: Date,
      default: null,
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    moderationFlags: [
      {
        reason: { type: String, required: true },
        flaggedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        flaggedAt: { type: Date, default: Date.now },
        resolved: { type: Boolean, default: false },
      },
    ],
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
    deletedAt: {
      type: Date,
      default: null,
    },
    deletedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    deletionReason: {
      type: String,
      default: null,
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

// Catalog and querying compound indexes
courseSchema.index({ isPublished: 1, status: 1, category: 1 });
courseSchema.index({ status: 1, publishedAt: -1 });
courseSchema.index({ status: 1, category: 1 });
courseSchema.index({ slug: 1, status: 1 });
courseSchema.index({ isDeleted: 1, isPublished: 1, status: 1 });
courseSchema.index({ instructor: 1, status: 1 });
courseSchema.index({ isDeleted: 1, instructor: 1 });

// Query hook to automatically exclude soft-deleted courses unless explicitly included
function filterOutDeleted(next) {
  const filter = this.getFilter ? this.getFilter() : null;
  if (filter && filter.includeDeleted === true) {
    delete filter.includeDeleted;
    return next();
  }
  if (!filter || filter.isDeleted === undefined) {
    this.where({ isDeleted: { $ne: true } });
  }
  next();
}

courseSchema.pre('find', filterOutDeleted);
courseSchema.pre('findOne', filterOutDeleted);
courseSchema.pre('countDocuments', filterOutDeleted);

// Virtual for instructorId
courseSchema.virtual('instructorId').get(function () {
  return this.instructor?._id || this.instructor;
});

// Virtual populate for modules
courseSchema.virtual('modules', {
  ref: 'Module',
  localField: '_id',
  foreignField: 'courseId',
  options: { sort: { order: 1 } },
});

const activeCourseFilter = {
  isDeleted: false,
  status: 'PUBLISHED',
  isPublished: true,
};

const Course = mongoose.model('Course', courseSchema);

module.exports = {
  Course,
  COURSE_DIFFICULTIES,
  COURSE_STATUSES,
  PRICING_TYPES,
  activeCourseFilter,
};
