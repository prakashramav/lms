const Cohort = require('../../models/cohort.model');
const Progress = require('../../models/progress.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const { User } = require('../../models/user.model');

/**
 * Create a new student cohort
 */
async function createCohort(data, creatorId) {
  const cohort = new Cohort({
    ...data,
    instructors: data.instructors && data.instructors.length > 0 ? data.instructors : [creatorId],
  });
  await cohort.save();
  return cohort;
}

/**
 * List cohorts with filters
 */
async function getCohorts(filter = {}) {
  return await Cohort.find(filter)
    .populate('instructors', 'name email')
    .populate('organizationId', 'name')
    .sort({ createdAt: -1 })
    .lean();
}

/**
 * Enroll students into a cohort
 */
async function enrollStudentsInCohort(cohortId, studentIds = []) {
  const cohort = await Cohort.findById(cohortId);
  if (!cohort) {
    throw new Error('Cohort not found');
  }

  const existingSet = new Set(cohort.students.map((id) => id.toString()));
  for (const sid of studentIds) {
    if (!existingSet.has(sid.toString())) {
      cohort.students.push(sid);
      existingSet.add(sid.toString());
    }
  }

  await cohort.save();
  return cohort;
}

/**
 * Get detailed cohort analytics dashboard
 */
async function getCohortDashboard(cohortId) {
  const cohort = await Cohort.findById(cohortId)
    .populate('students', 'name email createdAt')
    .populate('instructors', 'name email')
    .lean();

  if (!cohort) {
    throw new Error('Cohort not found');
  }

  const studentIds = (cohort.students || []).map((s) => s._id);

  if (studentIds.length === 0) {
    return {
      cohortId: cohort._id,
      name: cohort.name,
      code: cohort.code,
      track: cohort.track,
      totalStudents: 0,
      metrics: {
        averageProgress: 0,
        completionRate: 0,
        activeStudentsCount: 0,
      },
      dropOffRisk: [],
    };
  }

  // Aggregate progress for cohort members
  const progresses = await Progress.find({
    studentId: { $in: studentIds },
  }).lean();

  let totalProgress = 0;
  let completedCount = 0;
  const studentProgressMap = {};

  for (const p of progresses) {
    totalProgress += p.overallPercentage || 0;
    if (p.isCompleted) completedCount++;
    const sid = p.studentId.toString();
    studentProgressMap[sid] = Math.max(studentProgressMap[sid] || 0, p.overallPercentage || 0);
  }

  const avgProgress = progresses.length > 0 ? Math.round(totalProgress / progresses.length) : 0;
  const completionRate = progresses.length > 0 ? Math.round((completedCount / progresses.length) * 100) : 0;

  // Identify drop-off risk (students with progress < 20% or no activity)
  const dropOffRisk = [];
  for (const s of cohort.students) {
    const studentProg = studentProgressMap[s._id.toString()] || 0;
    if (studentProg < 25) {
      dropOffRisk.push({
        studentId: s._id,
        name: s.name,
        email: s.email,
        currentProgress: studentProg,
        riskLevel: studentProg === 0 ? 'HIGH' : 'MEDIUM',
      });
    }
  }

  // Update cohort metrics in DB asynchronously
  await Cohort.findByIdAndUpdate(cohortId, {
    'metrics.averageProgress': avgProgress,
    'metrics.completionRate': completionRate,
    'metrics.activeStudentsCount': studentIds.length - dropOffRisk.filter((r) => r.riskLevel === 'HIGH').length,
    'metrics.lastCalculatedAt': new Date(),
  });

  return {
    cohortId: cohort._id,
    name: cohort.name,
    code: cohort.code,
    track: cohort.track,
    totalStudents: studentIds.length,
    metrics: {
      averageProgress: avgProgress,
      completionRate,
      activeStudentsCount: studentIds.length - dropOffRisk.filter((r) => r.riskLevel === 'HIGH').length,
    },
    dropOffRisk,
  };
}

/**
 * Compare aggregate metrics across multiple cohorts
 */
async function compareCohorts(cohortIds = []) {
  const comparisons = [];
  for (const id of cohortIds) {
    try {
      const summary = await getCohortDashboard(id);
      comparisons.push({
        cohortId: summary.cohortId,
        name: summary.name,
        code: summary.code,
        track: summary.track,
        totalStudents: summary.totalStudents,
        averageProgress: summary.metrics.averageProgress,
        completionRate: summary.metrics.completionRate,
        atRiskCount: summary.dropOffRisk.length,
      });
    } catch (err) {
      // ignore missing cohort in comparison
    }
  }

  return {
    comparedCount: comparisons.length,
    cohorts: comparisons,
  };
}

module.exports = {
  createCohort,
  getCohorts,
  enrollStudentsInCohort,
  getCohortDashboard,
  compareCohorts,
};
