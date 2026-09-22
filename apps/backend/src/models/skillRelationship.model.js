const mongoose = require('mongoose');

const RELATIONSHIP_TYPES = ['PREREQUISITE', 'RELATED', 'SPECIALIZATION', 'ADVANCED_EXTENSION'];

const skillRelationshipSchema = new mongoose.Schema(
  {
    sourceSkillName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    targetSkillName: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    relationshipType: {
      type: String,
      enum: RELATIONSHIP_TYPES,
      default: 'RELATED',
      index: true,
    },
    weight: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 5.0,
    },
    description: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

skillRelationshipSchema.index({ sourceSkillName: 1, targetSkillName: 1 }, { unique: true });

const SkillRelationship = mongoose.models.SkillRelationship || mongoose.model('SkillRelationship', skillRelationshipSchema);

module.exports = {
  SkillRelationship,
  RELATIONSHIP_TYPES,
};
