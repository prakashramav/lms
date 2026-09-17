const { Skill, StudentSkill } = require('../../models/skill.model');
const { User } = require('../../models/user.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const Submission = require('../../models/submission.model');
const ProjectShowcase = require('../../models/projectShowcase.model');

/**
 * Calculate confidence level and score based on evidence array and provenance
 */
function calculateConfidence(evidence = []) {
  if (!evidence || evidence.length === 0) {
    return { confidence: 'LOW', confidenceScore: 0.1 };
  }

  let weight = 0;
  let hasObserved = false;
  let hasProject = false;
  let hasAssessment = false;

  for (const item of evidence) {
    if (item.provenance === 'OBSERVED') {
      weight += 0.35;
      hasObserved = true;
    } else if (item.provenance === 'INFERRED') {
      weight += 0.15;
    } else if (item.provenance === 'SELF_REPORTED') {
      weight += 0.1;
    }

    if (item.type === 'PROJECT') hasProject = true;
    if (item.type === 'ASSESSMENT') hasAssessment = true;
  }

  // Bonus if multi-modal evidence exists (both assessment and project)
  if (hasAssessment && hasProject) {
    weight += 0.2;
  }

  const confidenceScore = Math.min(Math.round(weight * 100) / 100, 1.0);

  let confidence = 'LOW';
  if (confidenceScore >= 0.75 && hasObserved) {
    confidence = 'HIGH';
  } else if (confidenceScore >= 0.4) {
    confidence = 'MEDIUM';
  }

  return { confidence, confidenceScore };
}

/**
 * Derive mastery level based on observed scores and evidence count
 */
function deriveMasteryLevel(observedScore, practiceCount, evidenceCount) {
  if (evidenceCount === 0 && practiceCount === 0) return 'NOT_STARTED';
  if (observedScore >= 90 && evidenceCount >= 3) return 'MASTERED';
  if (observedScore >= 80 && evidenceCount >= 2) return 'ADVANCED';
  if (observedScore >= 70) return 'PROFICIENT';
  if (observedScore >= 55) return 'INTERMEDIATE';
  if (observedScore >= 35) return 'DEVELOPING';
  if (practiceCount > 0 || evidenceCount > 0) return 'BEGINNER';
  return 'NOT_STARTED';
}

/**
 * Get structured Student Knowledge Profile
 */
async function getKnowledgeProfile(studentId) {
  const studentSkills = await StudentSkill.find({ studentId })
    .populate('skillId', 'name slug category difficulty prerequisites relatedSkills careerTracks')
    .lean();

  const profile = {
    studentId,
    lastAnalyzed: new Date(),
    summary: {
      totalSkills: studentSkills.length,
      highConfidenceSkills: 0,
      mediumConfidenceSkills: 0,
      lowConfidenceSkills: 0,
      observedEvidenceCount: 0,
      averageObservedScore: 0,
    },
    skills: [],
    provenanceBreakdown: {
      observed: [],
      inferred: [],
      selfReported: [],
    },
  };

  let totalScore = 0;
  let scoredCount = 0;

  for (const ss of studentSkills) {
    if (!ss.skillId) continue;

    const evidenceList = ss.evidence || [];
    const { confidence, confidenceScore } = calculateConfidence(evidenceList);

    if (confidence === 'HIGH') profile.summary.highConfidenceSkills++;
    else if (confidence === 'MEDIUM') profile.summary.mediumConfidenceSkills++;
    else profile.summary.lowConfidenceSkills++;

    const observedEvidence = evidenceList.filter((e) => e.provenance === 'OBSERVED');
    profile.summary.observedEvidenceCount += observedEvidence.length;

    if (ss.observedScore > 0) {
      totalScore += ss.observedScore;
      scoredCount++;
    }

    const skillItem = {
      skillId: ss.skillId._id,
      name: ss.skillId.name,
      slug: ss.skillId.slug,
      category: ss.skillId.category,
      level: ss.masteryLevel,
      confidence,
      confidenceScore,
      observedScore: ss.observedScore,
      selfReportedLevel: ss.selfReportedLevel,
      evidence: evidenceList.map((e) => ({
        type: e.type,
        provenance: e.provenance,
        score: e.score,
        notes: e.notes,
        verifiedAt: e.verifiedAt,
      })),
      lastUpdated: ss.lastUpdated || ss.updatedAt,
    };

    profile.skills.push(skillItem);

    // Populate provenance buckets
    if (evidenceList.some((e) => e.provenance === 'OBSERVED')) {
      profile.provenanceBreakdown.observed.push(ss.skillId.name);
    }
    if (evidenceList.some((e) => e.provenance === 'INFERRED')) {
      profile.provenanceBreakdown.inferred.push(ss.skillId.name);
    }
    if (ss.selfReportedLevel && ss.selfReportedLevel !== 'NONE') {
      profile.provenanceBreakdown.selfReported.push(ss.skillId.name);
    }
  }

  profile.summary.averageObservedScore =
    scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

  return profile;
}

/**
 * Add or update evidence for a student skill
 */
async function recordSkillEvidence(studentId, {
  skillSlug,
  evidenceType,
  provenance = 'OBSERVED',
  score = 0,
  referenceId = null,
  notes = '',
}) {
  let skill = await Skill.findOne({ slug: skillSlug.toLowerCase() });
  if (!skill) {
    // Graceful creation if not existing
    skill = await Skill.create({
      name: skillSlug.charAt(0).toUpperCase() + skillSlug.slice(1),
      slug: skillSlug.toLowerCase(),
      category: 'GENERAL',
    });
  }

  let studentSkill = await StudentSkill.findOne({
    studentId,
    skillId: skill._id,
  });

  if (!studentSkill) {
    studentSkill = new StudentSkill({
      studentId,
      skillId: skill._id,
      evidence: [],
      practiceCount: 0,
      exposureCount: 1,
    });
  }

  // Push new evidence item
  studentSkill.evidence.push({
    type: evidenceType,
    provenance,
    score,
    referenceId,
    notes,
    verifiedAt: new Date(),
  });

  studentSkill.exposureCount = (studentSkill.exposureCount || 0) + 1;
  if (evidenceType === 'CODE_PRACTICE') {
    studentSkill.practiceCount = (studentSkill.practiceCount || 0) + 1;
  }

  // Update observed score as rolling average
  if (provenance === 'OBSERVED' && score > 0) {
    if (studentSkill.observedScore > 0) {
      studentSkill.observedScore = Math.round((studentSkill.observedScore + score) / 2);
    } else {
      studentSkill.observedScore = score;
    }
  }

  // Recalculate confidence
  const { confidence, confidenceScore } = calculateConfidence(studentSkill.evidence);
  studentSkill.confidence = confidence;
  studentSkill.confidenceScore = confidenceScore;

  // Derive level
  studentSkill.masteryLevel = deriveMasteryLevel(
    studentSkill.observedScore,
    studentSkill.practiceCount,
    studentSkill.evidence.length
  );
  studentSkill.lastUpdated = new Date();

  await studentSkill.save();
  return studentSkill;
}

/**
 * Update student self-reported skill level
 */
async function updateSelfReportedSkill(studentId, skillSlug, level) {
  let skill = await Skill.findOne({ slug: skillSlug.toLowerCase() });
  if (!skill) {
    skill = await Skill.create({
      name: skillSlug.charAt(0).toUpperCase() + skillSlug.slice(1),
      slug: skillSlug.toLowerCase(),
      category: 'GENERAL',
    });
  }

  let studentSkill = await StudentSkill.findOne({
    studentId,
    skillId: skill._id,
  });

  if (!studentSkill) {
    studentSkill = new StudentSkill({
      studentId,
      skillId: skill._id,
      evidence: [],
    });
  }

  studentSkill.selfReportedLevel = level;
  // Add self-reported evidence
  studentSkill.evidence.push({
    type: 'SELF_REPORTED',
    provenance: 'SELF_REPORTED',
    score: level === 'ADVANCED' ? 85 : level === 'INTERMEDIATE' ? 60 : 35,
    notes: `Self-declared as ${level}`,
    verifiedAt: new Date(),
  });

  const { confidence, confidenceScore } = calculateConfidence(studentSkill.evidence);
  studentSkill.confidence = confidence;
  studentSkill.confidenceScore = confidenceScore;
  studentSkill.lastUpdated = new Date();

  await studentSkill.save();
  return studentSkill;
}

module.exports = {
  getKnowledgeProfile,
  recordSkillEvidence,
  updateSelfReportedSkill,
  calculateConfidence,
  deriveMasteryLevel,
};
