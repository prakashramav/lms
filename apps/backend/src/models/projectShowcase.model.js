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
    stage: {
      type: String,
      enum: [
        'IDEA',
        'PLANNING',
        'SETUP',
        'DEVELOPMENT',
        'TESTING',
        'DEPLOYMENT',
        'DOCUMENTATION',
        'PORTFOLIO',
      ],
      default: 'DEVELOPMENT',
      index: true,
    },
    features: [
      {
        type: String,
        trim: true,
      },
    ],
    qualityChecklist: {
      architecture: { type: Boolean, default: false },
      codeQuality: { type: Boolean, default: false },
      testing: { type: Boolean, default: false },
      security: { type: Boolean, default: false },
      documentation: { type: Boolean, default: false },
      deployment: { type: Boolean, default: false },
      ux: { type: Boolean, default: false },
    },
    verification: {
      githubVerified: { type: Boolean, default: false },
      githubMetadata: {
        repoName: { type: String, default: '' },
        defaultBranch: { type: String, default: 'main' },
        lastCommitDate: { type: Date, default: null },
        openIssues: { type: Number, default: 0 },
        hasReadme: { type: Boolean, default: false },
      },
      liveStatus: {
        type: String,
        enum: ['ONLINE', 'UNREACHABLE', 'PENDING', 'UNVERIFIED'],
        default: 'UNVERIFIED',
      },
      lastHealthCheckAt: { type: Date, default: null },
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
