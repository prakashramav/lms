const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Resource name is required'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['PDF', 'PPT', 'DOC', 'LINK', 'IMAGE', 'VIDEO', 'CODE', 'ARCHIVE', 'OTHER'],
      default: 'LINK',
      index: true,
    },
    url: {
      type: String,
      required: [true, 'Resource URL or file path is required'],
      trim: true,
    },
    key: {
      type: String,
      default: null,
      trim: true,
    },
    size: {
      type: Number, // In bytes
      default: 0,
    },
    mimeType: {
      type: String,
      default: 'application/octet-stream',
    },
    lessonId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      default: null,
      index: true,
    },
    courseId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: [true, 'Course ID reference is required'],
      index: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

resourceSchema.index({ courseId: 1, lessonId: 1 });

const Resource = mongoose.model('Resource', resourceSchema);

module.exports = Resource;
