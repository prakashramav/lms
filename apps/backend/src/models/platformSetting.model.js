const mongoose = require('mongoose');

const platformSettingSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
    group: {
      type: String,
      enum: [
        'GENERAL',
        'AUTHENTICATION',
        'SECURITY',
        'NOTIFICATIONS',
        'COURSE_POLICIES',
        'ASSESSMENT_POLICIES',
        'CODING_POLICIES',
        'AI_POLICIES',
        'STORAGE',
        'SYSTEM',
      ],
      default: 'GENERAL',
      index: true,
    },
    description: {
      type: String,
      default: '',
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

const PlatformSetting = mongoose.model('PlatformSetting', platformSettingSchema);

module.exports = PlatformSetting;
