const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    tokenHash: {
      type: String,
      required: true,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ['STUDENT', 'INSTRUCTOR', 'ADMIN', 'SUPER_ADMIN', 'EMPLOYER'],
      default: 'STUDENT',
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
    userAgent: {
      type: String,
      default: null,
    },
    ipAddress: {
      type: String,
      default: null,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

// Method to verify if token is active
refreshTokenSchema.methods.isActive = function () {
  return !this.revokedAt && new Date() < this.expiresAt;
};

// Compound index for user session lookup
refreshTokenSchema.index({ userId: 1, expiresAt: 1 });

// TTL index to automatically purge documents 30 days after expiration
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
