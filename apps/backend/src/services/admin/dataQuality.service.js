const { Course } = require('../../models/course.model');
const { Lesson } = require('../../models/lesson.model');
const Progress = require('../../models/progress.model');
const Assessment = require('../../models/assessment.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const Certificate = require('../../models/certificate.model');
const Job = require('../../models/job.model');
const { Skill } = require('../../models/skill.model');
const { User } = require('../../models/user.model');
const AuditLog = require('../../models/auditLog.model');

/**
 * Scan database for data inconsistencies, orphaned records, and broken relationships
 */
async function scanDataQuality() {
  const issues = [];

  // 1. Orphan Progress (references non-existent Course or User)
  const allProgress = await Progress.find().select('courseId studentId').lean();
  const orphanProgress = [];
  for (const p of allProgress) {
    const courseExists = await Course.exists({ _id: p.courseId });
    const userExists = await User.exists({ _id: p.studentId });
    if (!courseExists || !userExists) {
      orphanProgress.push({
        id: p._id,
        reason: !courseExists ? 'Missing Course' : 'Missing Student User',
      });
    }
  }
  if (orphanProgress.length > 0) {
    issues.push({
      category: 'ORPHAN_PROGRESS',
      severity: 'MEDIUM',
      description: 'Progress records referencing deleted courses or non-existent students',
      affectedCount: orphanProgress.length,
      sampleRecords: orphanProgress.slice(0, 5),
      suggestedAction: 'Clean up orphaned progress records',
    });
  }

  // 2. Orphan Lessons (references non-existent Course)
  const allLessons = await Lesson.find().select('courseId title').lean();
  const orphanLessons = [];
  for (const l of allLessons) {
    const courseExists = await Course.exists({ _id: l.courseId });
    if (!courseExists) {
      orphanLessons.push({ id: l._id, title: l.title });
    }
  }
  if (orphanLessons.length > 0) {
    issues.push({
      category: 'ORPHAN_LESSONS',
      severity: 'HIGH',
      description: 'Lesson documents with no parent Course',
      affectedCount: orphanLessons.length,
      sampleRecords: orphanLessons.slice(0, 5),
      suggestedAction: 'Reassign or archive orphaned lessons',
    });
  }

  // 3. Broken Job Postings (Missing company or required skills)
  const brokenJobs = await Job.find({
    $or: [{ skillsRequired: { $size: 0 } }, { title: { $in: ['', null] } }],
  })
    .select('title companyName status')
    .lean();

  if (brokenJobs.length > 0) {
    issues.push({
      category: 'BROKEN_JOBS',
      severity: 'LOW',
      description: 'Job postings lacking required skills or title',
      affectedCount: brokenJobs.length,
      sampleRecords: brokenJobs.slice(0, 5),
      suggestedAction: 'Update skill tags or unpublish incomplete jobs',
    });
  }

  // 4. Missing Skills (Courses referencing skill tags not present in Skill collection)
  const coursesWithSkills = await Course.find({ 'skills.0': { $exists: true } }).select('skills title').lean();
  const allKnownSkills = await Skill.find().select('slug').lean();
  const knownSkillSlugs = new Set(allKnownSkills.map((s) => s.slug.toLowerCase()));

  const missingSkills = new Set();
  for (const c of coursesWithSkills) {
    for (const s of c.skills || []) {
      const slug = s.toLowerCase().trim().replace(/\s+/g, '-');
      if (!knownSkillSlugs.has(slug)) {
        missingSkills.add(slug);
      }
    }
  }

  if (missingSkills.size > 0) {
    issues.push({
      category: 'MISSING_SKILL_DEFINITIONS',
      severity: 'LOW',
      description: 'Skills referenced in courses that lack a formal Skill graph definition',
      affectedCount: missingSkills.size,
      sampleRecords: Array.from(missingSkills).slice(0, 10),
      suggestedAction: 'Auto-seed missing skill graph nodes',
    });
  }

  return {
    scannedAt: new Date(),
    totalIssuesCount: issues.length,
    healthStatus: issues.length === 0 ? 'HEALTHY' : issues.some((i) => i.severity === 'HIGH') ? 'ACTION_REQUIRED' : 'WARNING',
    issues,
  };
}

/**
 * Preview repair actions before executing
 */
async function previewDataRepair(category) {
  const scan = await scanDataQuality();
  const matchedIssue = scan.issues.find((i) => i.category === category);
  if (!matchedIssue) {
    return {
      category,
      canRepair: false,
      message: 'No active discrepancies found for this category',
      affectedRecords: [],
    };
  }

  return {
    category,
    canRepair: true,
    affectedCount: matchedIssue.affectedCount,
    proposedAction: matchedIssue.suggestedAction,
    previewSamples: matchedIssue.sampleRecords,
    requiresConfirmation: true,
  };
}

/**
 * Execute verified repair with audit log (Requires confirmation)
 */
async function executeDataRepair(user, category, confirmationToken) {
  if (!confirmationToken || confirmationToken !== 'CONFIRM_REPAIR') {
    throw new Error('Explicit confirmation token "CONFIRM_REPAIR" required to execute data repair');
  }

  let repairedCount = 0;
  let actionSummary = '';

  if (category === 'ORPHAN_PROGRESS') {
    const allProgress = await Progress.find().select('courseId studentId');
    for (const p of allProgress) {
      const courseExists = await Course.exists({ _id: p.courseId });
      const userExists = await User.exists({ _id: p.studentId });
      if (!courseExists || !userExists) {
        await Progress.deleteOne({ _id: p._id });
        repairedCount++;
      }
    }
    actionSummary = `Removed ${repairedCount} orphan progress records`;
  } else if (category === 'MISSING_SKILL_DEFINITIONS') {
    const courses = await Course.find({ 'skills.0': { $exists: true } }).select('skills');
    const knownSkills = await Skill.find().select('slug');
    const knownSet = new Set(knownSkills.map((s) => s.slug.toLowerCase()));

    for (const c of courses) {
      for (const s of c.skills || []) {
        const slug = s.toLowerCase().trim().replace(/\s+/g, '-');
        if (!knownSet.has(slug)) {
          await Skill.create({
            name: s,
            slug,
            category: 'GENERAL',
          });
          knownSet.add(slug);
          repairedCount++;
        }
      }
    }
    actionSummary = `Created ${repairedCount} new Skill graph nodes for missing course skill tags`;
  } else {
    throw new Error(`Automatic repair not supported for category '${category}'`);
  }

  // Record Audit Log
  try {
    await AuditLog.create({
      actor: user._id,
      actorRole: user.role,
      action: 'DATA_REPAIR_EXECUTED',
      targetResource: category,
      details: {
        repairedCount,
        actionSummary,
      },
    });
  } catch (err) {
    // Non-fatal
  }

  return {
    success: true,
    category,
    repairedCount,
    actionSummary,
    executedBy: user.email || user._id,
    executedAt: new Date(),
  };
}

module.exports = {
  scanDataQuality,
  previewDataRepair,
  executeDataRepair,
};
