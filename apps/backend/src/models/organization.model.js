const mongoose = require('mongoose');

/**
 * Multi-Tenancy Organization Model
 * Phase 15 — Multi-Tenancy Foundation (Sections 103 - 107)
 */

const ORG_TYPES = ['EMPLOYER', 'INSTITUTION', 'BOOTCAMP', 'ENTERPRISE'];
const MEMBER_ROLES = ['OWNER', 'ADMIN', 'RECRUITER', 'HIRING_MANAGER', 'INSTRUCTOR', 'TEACHING_ASSISTANT', 'VIEWER'];

const memberSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    role: {
      type: String,
      enum: MEMBER_ROLES,
      default: 'VIEWER',
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      trim: true,
      maxlength: [120, 'Organization name cannot exceed 120 characters'],
    },
    slug: {
      type: String,
      required: [true, 'Organization slug is required'],
      unique: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    type: {
      type: String,
      enum: ORG_TYPES,
      default: 'EMPLOYER',
      index: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    members: [memberSchema],
    settings: {
      allowedDomains: [{ type: String, trim: true, lowercase: true }],
      enforceSSO: { type: Boolean, default: false },
      tier: {
        type: String,
        enum: ['FREE', 'STANDARD', 'PREMIUM', 'ENTERPRISE'],
        default: 'STANDARD',
      },
    },
    status: {
      type: String,
      enum: ['ACTIVE', 'SUSPENDED', 'PENDING_VERIFICATION'],
      default: 'ACTIVE',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

organizationSchema.index({ 'members.userId': 1 });

const Organization = mongoose.models.Organization || mongoose.model('Organization', organizationSchema);

module.exports = {
  Organization,
  ORG_TYPES,
  MEMBER_ROLES,
};
