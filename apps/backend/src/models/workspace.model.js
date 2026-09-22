const mongoose = require('mongoose');

const WORKSPACE_TYPES = [
  'CODE_RUNNER',
  'CLOUD_IDE',
  'DATABASE_LAB',
  'DATA_SCIENCE_LAB',
  'DEEP_LEARNING_LAB',
  'GENAI_LAB',
];

const WORKSPACE_STATUSES = [
  'CREATING',
  'STARTING',
  'RUNNING',
  'STOPPING',
  'STOPPED',
  'PAUSED',
  'FAILED',
  'DELETING',
  'DELETED',
];

const RESOURCE_PROFILES = ['BASIC', 'STANDARD', 'ML', 'GPU'];

const workspaceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      default: null,
      index: true,
    },
    moduleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      default: null,
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    assignmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      default: null,
      index: true,
    },

    templateId: {
      type: String,
      required: [true, 'Workspace template ID is required'],
      trim: true,
      index: true,
    },
    templateVersion: {
      type: String,
      default: '1.0',
    },

    workspaceType: {
      type: String,
      enum: WORKSPACE_TYPES,
      default: 'CLOUD_IDE',
      index: true,
    },

    status: {
      type: String,
      enum: WORKSPACE_STATUSES,
      default: 'CREATING',
      index: true,
    },

    workspaceUrl: {
      type: String,
      default: null,
    },
    previewUrl: {
      type: String,
      default: null,
    },

    containerId: {
      type: String,
      default: null,
    },
    persistentVolumeId: {
      type: String,
      default: null,
    },
    storagePath: {
      type: String,
      default: null,
    },

    resourceProfile: {
      type: String,
      enum: RESOURCE_PROFILES,
      default: 'STANDARD',
    },
    hardware: {
      type: String,
      enum: ['cpu', 'gpu'],
      default: 'cpu',
    },

    isInstructorPreview: {
      type: Boolean,
      default: false,
      index: true,
    },

    inactivityTimeoutMinutes: {
      type: Number,
      default: 30,
    },
    lastActiveAt: {
      type: Date,
      default: Date.now,
      index: true,
    },

    metrics: {
      durationMinutes: { type: Number, default: 0 },
      cpuPercent: { type: Number, default: 0 },
      memoryMB: { type: Number, default: 0 },
      storageMB: { type: Number, default: 0 },
      gpuMinutes: { type: Number, default: 0 },
      tokenUsage: { type: Number, default: 0 },
      cost: { type: Number, default: 0 },
    },

    failureReason: {
      type: String,
      default: null,
    },

    environmentVariables: {
      type: Map,
      of: String,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

workspaceSchema.index({ userId: 1, courseId: 1, lessonId: 1, status: 1 });
workspaceSchema.index({ status: 1, lastActiveAt: 1 });

const Workspace = mongoose.model('Workspace', workspaceSchema);

module.exports = {
  Workspace,
  WORKSPACE_TYPES,
  WORKSPACE_STATUSES,
  RESOURCE_PROFILES,
};
