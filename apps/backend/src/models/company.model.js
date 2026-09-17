const mongoose = require('mongoose');

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
      index: true,
    },
    logo: {
      type: String,
      default: '',
    },
    description: {
      type: String,
      default: '',
    },
    website: {
      type: String,
      default: '',
    },
    industry: {
      type: String,
      default: 'Technology',
      index: true,
    },
    locations: [
      {
        type: String,
      },
    ],
    size: {
      type: String,
      enum: ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'],
      default: '51-200',
    },
    status: {
      type: String,
      enum: ['VERIFIED', 'PENDING', 'ARCHIVED'],
      default: 'VERIFIED',
      index: true,
    },
    employerUserIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Company = mongoose.models.Company || mongoose.model('Company', companySchema);

module.exports = Company;
