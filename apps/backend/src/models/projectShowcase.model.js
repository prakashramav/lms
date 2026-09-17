const mongoose = require('mongoose');

const projectShowcaseSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
    },
    techStack: [
      {
        type: String,
        trim: true,
      },
    ],
    githubUrl: {
      type: String,
      default: '',
      trim: true,
    },
    demoUrl: {
      type: String,
      default: '',
      trim: true,
    },
    screenshots: [
      {
        type: String,
      },
    ],
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE', 'UNLISTED'],
      default: 'PUBLIC',
      index: true,
    },
    likesCount: {
      type: Number,
      default: 0,
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true,
    },
    moderationStatus: {
      type: String,
      enum: ['APPROVED', 'FLAGGED', 'REMOVED'],
      default: 'APPROVED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

projectShowcaseSchema.index({ visibility: 1, moderationStatus: 1, createdAt: -1 });
projectShowcaseSchema.index({ studentId: 1, createdAt: -1 });

const ProjectShowcase = mongoose.models.ProjectShowcase || mongoose.model('ProjectShowcase', projectShowcaseSchema);

module.exports = ProjectShowcase;
