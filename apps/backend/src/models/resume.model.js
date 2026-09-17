const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Resume title is required'],
      default: 'My Resume',
      trim: true,
    },
    template: {
      type: String,
      enum: ['MINIMAL', 'MODERN', 'TECHNICAL', 'ACADEMIC', 'ATS'],
      default: 'MODERN',
    },
    personalInfo: {
      fullName: { type: String, default: '' },
      email: { type: String, default: '' },
      phone: { type: String, default: '' },
      location: { type: String, default: '' },
      website: { type: String, default: '' },
      github: { type: String, default: '' },
      linkedin: { type: String, default: '' },
    },
    summary: {
      type: String,
      default: '',
    },
    education: [
      {
        institution: { type: String, default: '' },
        degree: { type: String, default: '' },
        fieldOfStudy: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        current: { type: Boolean, default: false },
        gpa: { type: String, default: '' },
      },
    ],
    experience: [
      {
        company: { type: String, default: '' },
        role: { type: String, default: '' },
        location: { type: String, default: '' },
        startDate: { type: String, default: '' },
        endDate: { type: String, default: '' },
        current: { type: Boolean, default: false },
        description: { type: String, default: '' },
        achievements: [{ type: String }],
      },
    ],
    skills: [
      {
        name: { type: String, default: '' },
        level: { type: String, default: 'Intermediate' },
        category: { type: String, default: 'General' },
      },
    ],
    projects: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        technologies: [{ type: String }],
        link: { type: String, default: '' },
        githubUrl: { type: String, default: '' },
      },
    ],
    certifications: [
      {
        name: { type: String, default: '' },
        issuer: { type: String, default: '' },
        issueDate: { type: String, default: '' },
        expiryDate: { type: String, default: '' },
        credentialUrl: { type: String, default: '' },
      },
    ],
    achievements: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        date: { type: String, default: '' },
      },
    ],
    links: [
      {
        label: { type: String, default: '' },
        url: { type: String, default: '' },
      },
    ],
    version: {
      type: Number,
      default: 1,
    },
    versionHistory: [
      {
        versionNumber: { type: Number },
        snapshot: { type: Object },
        savedAt: { type: Date, default: Date.now },
      },
    ],
  },
  {
    timestamps: true,
  }
);

resumeSchema.index({ studentId: 1, title: 1 });

const Resume = mongoose.models.Resume || mongoose.model('Resume', resumeSchema);

module.exports = Resume;
