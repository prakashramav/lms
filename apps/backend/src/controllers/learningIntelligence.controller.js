const knowledgeProfileService = require('../services/intelligence/knowledgeProfile.service');
const skillDependencyService = require('../services/intelligence/skillDependency.service');
const Progress = require('../models/progress.model');
const CareerProfile = require('../models/careerProfile.model');
const CareerPath = require('../models/careerPath.model');
const { Skill } = require('../models/skill.model');

/**
 * GET /api/v1/learning-intelligence/profile
 */
async function getKnowledgeProfile(req, res, next) {
  try {
    const studentId = req.user._id;
    const profile = await knowledgeProfileService.getKnowledgeProfile(studentId);
    return res.status(200).json({
      success: true,
      data: profile,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/learning-intelligence/evidence
 */
async function addSkillEvidence(req, res, next) {
  try {
    const studentId = req.user._id;
    const { skillSlug, evidenceType, score, notes, referenceId, provenance } = req.body;
    if (!skillSlug || !evidenceType) {
      return res.status(400).json({
        success: false,
        message: 'skillSlug and evidenceType are required',
      });
    }

    const updated = await knowledgeProfileService.recordSkillEvidence(studentId, {
      skillSlug,
      evidenceType,
      score: Number(score) || 0,
      notes,
      referenceId,
      provenance: provenance || 'OBSERVED',
    });

    return res.status(201).json({
      success: true,
      message: 'Evidence recorded and confidence recalculated',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/v1/learning-intelligence/self-reported
 */
async function setSelfReportedSkill(req, res, next) {
  try {
    const studentId = req.user._id;
    const { skillSlug, level } = req.body;
    if (!skillSlug || !level) {
      return res.status(400).json({
        success: false,
        message: 'skillSlug and level are required',
      });
    }

    const updated = await knowledgeProfileService.updateSelfReportedSkill(
      studentId,
      skillSlug,
      level
    );

    return res.status(200).json({
      success: true,
      message: 'Self-reported skill updated',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/learning-intelligence/dependencies/:skillSlug
 */
async function getSkillDependencies(req, res, next) {
  try {
    const studentId = req.user._id;
    const { skillSlug } = req.params;
    const analysis = await skillDependencyService.analyzePrerequisiteGaps(studentId, skillSlug);
    return res.status(200).json({
      success: true,
      data: analysis,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/learning-intelligence/roadmap
 * Roadmap with states: NOT_STARTED, IN_PROGRESS, COMPLETED, SKIPPED, BLOCKED
 * and transparent rationale
 */
async function getPersonalizedRoadmap(req, res, next) {
  try {
    const studentId = req.user._id;
    const profile = await knowledgeProfileService.getKnowledgeProfile(studentId);
    const careerProfile = await CareerProfile.findOne({ studentId }).lean();
    const targetCareer = careerProfile?.targetRole || 'Full Stack Developer';

    const careerPath = await CareerPath.findOne({
      $or: [
        { title: new RegExp(targetCareer, 'i') },
        { slug: targetCareer.toLowerCase().replace(/\s+/g, '-') },
        { isFeatured: true },
      ],
    }).lean();

    const requiredSkills = careerPath?.requiredSkills || ['HTML', 'CSS', 'JavaScript', 'React', 'Node.js', 'MongoDB'];

    const studentSkillMap = new Map();
    for (const s of profile.skills) {
      studentSkillMap.set(s.slug.toLowerCase(), s);
      studentSkillMap.set(s.name.toLowerCase(), s);
    }

    const roadmapItems = [];
    let previousCompleted = true;

    for (let i = 0; i < requiredSkills.length; i++) {
      const skillName = requiredSkills[i];
      const normalized = skillName.toLowerCase();
      const existing = studentSkillMap.get(normalized);

      let status = 'NOT_STARTED';
      let reason = `Recommended for ${targetCareer} track.`;

      if (existing) {
        if (['MASTERED', 'ADVANCED', 'PROFICIENT'].includes(existing.level) && existing.confidence !== 'LOW') {
          status = 'COMPLETED';
          reason = `Demonstrated high confidence (${existing.confidence}) with ${existing.evidence.length} evidence items.`;
        } else if (existing.observedScore > 0 || existing.level === 'DEVELOPING') {
          status = 'IN_PROGRESS';
          reason = `Active development in progress. Current observed score: ${existing.observedScore}%.`;
        }
      }

      if (status === 'NOT_STARTED' && !previousCompleted && i > 1) {
        status = 'BLOCKED';
        reason = `Prerequisite milestones must be completed first to ensure sound foundation.`;
      }

      if (status !== 'COMPLETED') {
        previousCompleted = false;
      }

      roadmapItems.push({
        id: `rm_${i + 1}`,
        order: i + 1,
        skill: skillName,
        status,
        confidence: existing ? existing.confidence : 'LOW',
        evidenceCount: existing ? existing.evidence.length : 0,
        explanation: reason,
        estimatedWeeks: 2,
        actionUrl: `/learn?skill=${encodeURIComponent(skillName)}`,
      });
    }

    return res.status(200).json({
      success: true,
      data: {
        targetCareer,
        totalMilestones: roadmapItems.length,
        completedMilestones: roadmapItems.filter((m) => m.status === 'COMPLETED').length,
        items: roadmapItems,
      },
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/v1/learning-intelligence/daily-plan
 * Configurable daily plan (e.g. 60 min default)
 */
async function getDailyLearningPlan(req, res, next) {
  try {
    const availableMinutes = Number(req.query.minutes) || 60;
    const lessonMinutes = Math.round(availableMinutes * 0.35);
    const practiceMinutes = Math.round(availableMinutes * 0.35);
    const revisionMinutes = Math.max(availableMinutes - lessonMinutes - practiceMinutes, 10);

    const plan = {
      availableMinutes,
      date: new Date().toISOString().split('T')[0],
      blocks: [
        {
          type: 'LESSON',
          durationMinutes: lessonMinutes,
          title: 'Core Concept Learning',
          description: 'Watch video module or read lesson theory with active note taking',
          actionUrl: '/courses',
        },
        {
          type: 'PRACTICE',
          durationMinutes: practiceMinutes,
          title: 'Hands-on Code Practice',
          description: 'Solve interactive coding challenges and unit test edge cases',
          actionUrl: '/practice',
        },
        {
          type: 'REVISION',
          durationMinutes: revisionMinutes,
          title: 'Active Recall & Spaced Review',
          description: 'Review mistakes and test key definitions',
          actionUrl: '/spaced-review',
        },
      ],
      adaptiveNote: 'Missed yesterday? No penalty. Today starts fresh at your designated pace.',
    };

    return res.status(200).json({
      success: true,
      data: plan,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getKnowledgeProfile,
  addSkillEvidence,
  setSelfReportedSkill,
  getSkillDependencies,
  getPersonalizedRoadmap,
  getDailyLearningPlan,
};
