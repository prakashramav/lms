const mongoose = require('mongoose');

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: [true, 'Feature flag key is required'],
      unique: true,
      trim: true,
      uppercase: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: false,
    },
    environment: {
      type: String,
      enum: ['ALL', 'DEVELOPMENT', 'STAGING', 'PRODUCTION'],
      default: 'ALL',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

const FeatureFlag = mongoose.model('FeatureFlag', featureFlagSchema);

module.exports = FeatureFlag;
