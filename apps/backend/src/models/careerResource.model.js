const mongoose = require('mongoose');

const careerResourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
    },
    category: {
      type: String,
      enum: ['RESUME', 'INTERVIEW', 'PORTFOLIO', 'COMMUNICATION', 'SYSTEM_DESIGN', 'CODING', 'CAREER_SKILLS'],
      required: [true, 'Resource category is required'],
      index: true,
    },
    content: {
      type: String,
      required: [true, 'Resource content is required'],
    },
    tags: [
      {
        type: String,
        trim: true,
      },
    ],
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    status: {
      type: String,
      enum: ['PUBLISHED', 'DRAFT'],
      default: 'PUBLISHED',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

const CareerResource = mongoose.models.CareerResource || mongoose.model('CareerResource', careerResourceSchema);

module.exports = CareerResource;
