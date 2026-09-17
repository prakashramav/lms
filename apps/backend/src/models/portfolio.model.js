const mongoose = require('mongoose');

const portfolioSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    username: {
      type: String,
      required: [true, 'Portfolio username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    visibility: {
      type: String,
      enum: ['PUBLIC', 'PRIVATE', 'UNLISTED'],
      default: 'PUBLIC',
      index: true,
    },
    headline: {
      type: String,
      default: 'Full Stack Developer',
    },
    about: {
      type: String,
      default: '',
    },
    skills: [
      {
        type: String,
        trim: true,
      },
    ],
    projects: [
      {
        title: { type: String, required: true },
        description: { type: String, default: '' },
        technologies: [{ type: String }],
        githubUrl: { type: String, default: '' },
        liveUrl: { type: String, default: '' },
        imageUrl: { type: String, default: '' },
        features: [{ type: String }],
        role: { type: String, default: '' },
        outcome: { type: String, default: '' },
        status: {
          type: String,
          enum: ['PLANNED', 'IN_PROGRESS', 'COMPLETED', 'SHOWCASE'],
          default: 'SHOWCASE',
        },
        isFeatured: { type: Boolean, default: true },
      },
    ],
    experience: [
      {
        company: { type: String, default: '' },
        role: { type: String, default: '' },
        period: { type: String, default: '' },
        description: { type: String, default: '' },
      },
    ],
    education: [
      {
        institution: { type: String, default: '' },
        degree: { type: String, default: '' },
        year: { type: String, default: '' },
      },
    ],
    achievements: [
      {
        title: { type: String, default: '' },
        description: { type: String, default: '' },
        year: { type: String, default: '' },
      },
    ],
    links: [
      {
        label: { type: String, default: '' },
        url: { type: String, default: '' },
      },
    ],
    contactEmail: {
      type: String,
      default: '',
    },
    seoMetadata: {
      title: { type: String, default: '' },
      description: { type: String, default: '' },
      ogImage: { type: String, default: '' },
    },
  },
  {
    timestamps: true,
  }
);

const Portfolio = mongoose.models.Portfolio || mongoose.model('Portfolio', portfolioSchema);

module.exports = Portfolio;
