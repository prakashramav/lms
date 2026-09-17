const mongoose = require('mongoose');

const careerPathSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Career path name is required'],
      trim: true,
    },
    slug: {
      type: String,
      required: [true, 'Career path slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['FRONTEND', 'BACKEND', 'FULLSTACK', 'MOBILE', 'DATA', 'AI_ML', 'DEVOPS', 'CLOUD', 'CYBERSECURITY', 'OTHER'],
      default: 'FULLSTACK',
      index: true,
    },
    requiredSkills: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Skill',
      },
    ],
    recommendedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
      },
    ],
    recommendedProjects: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        technologies: [{ type: String }],
        difficulty: {
          type: String,
          enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
          default: 'INTERMEDIATE',
        },
      },
    ],
    recommendedCertifications: [
      {
        type: String,
      },
    ],
    interviewTopics: [
      {
        type: String,
      },
    ],
    resumeKeywords: [
      {
        type: String,
      },
    ],
    roadmapStages: [
      {
        stageNumber: { type: Number, required: true },
        title: { type: String, required: true },
        description: { type: String, default: '' },
        skills: [{ type: String }],
      },
    ],
    difficulty: {
      type: String,
      enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'],
      default: 'INTERMEDIATE',
    },
    status: {
      type: String,
      enum: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      default: 'PUBLISHED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const CareerPath = mongoose.models.CareerPath || mongoose.model('CareerPath', careerPathSchema);

module.exports = CareerPath;
