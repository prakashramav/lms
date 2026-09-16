const Assessment = require('../models/assessment.model');
const Question = require('../models/question.model');
const AssessmentAttempt = require('../models/assessmentAttempt.model');
const { Enrollment } = require('../models/enrollment.model');

/**
 * List assessments with filtering, pagination, and student telemetry
 */
async function getAssessments({
  courseId,
  moduleId,
  difficulty,
  type,
  search,
  studentId,
  page = 1,
  limit = 12,
  isStudent = true,
}) {
  const query = {};

  if (isStudent) {
    query.status = 'PUBLISHED';
    query.isPublished = true;
  }

  if (courseId) query.courseId = courseId;
  if (moduleId) query.moduleId = moduleId;
  if (difficulty && difficulty !== 'all') query.difficulty = difficulty;
  if (type && type !== 'all') query.type = type;

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { description: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 12));
  const skip = (pageNum - 1) * limitNum;

  const [total, assessments] = await Promise.all([
    Assessment.countDocuments(query),
    Assessment.find(query)
      .populate('courseId', 'title slug thumbnail category')
      .populate('moduleId', 'title order')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  // Enrich with question counts and student attempt stats
  const items = await Promise.all(
    assessments.map(async (ass) => {
      const questionCount = await Question.countDocuments({
        assessmentId: ass._id,
        isActive: true,
      });

      let studentStats = {
        attemptsCount: 0,
        bestScore: null,
        bestPercentage: null,
        hasPassed: false,
        inProgressAttemptId: null,
      };

      if (studentId) {
        const attempts = await AssessmentAttempt.find({
          assessmentId: ass._id,
          studentId,
        }).lean();

        studentStats.attemptsCount = attempts.length;
        const submitted = attempts.filter((a) => a.status === 'SUBMITTED');
        if (submitted.length > 0) {
          const highest = submitted.reduce((prev, curr) =>
            (curr.percentage || 0) > (prev.percentage || 0) ? curr : prev
          );
          studentStats.bestScore = highest.score;
          studentStats.bestPercentage = highest.percentage;
          studentStats.hasPassed = submitted.some((a) => a.passed);
        }

        const activeAttempt = attempts.find((a) => a.status === 'IN_PROGRESS');
        if (activeAttempt) {
          studentStats.inProgressAttemptId = activeAttempt._id;
        }
      }

      return {
        ...ass,
        questionCount,
        studentStats,
      };
    })
  );

  return {
    items,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

/**
 * Get assessment detail by ID or Slug with previous student attempts
 */
async function getAssessmentById(identifier, studentId, isStudent = true) {
  const isObjectId = /^[0-9a-fA-F]{24}$/.test(identifier);
  const query = isObjectId ? { _id: identifier } : { slug: identifier };

  if (isStudent) {
    query.status = 'PUBLISHED';
    query.isPublished = true;
  }

  const assessment = await Assessment.findOne(query)
    .populate('courseId', 'title slug thumbnail category')
    .populate('moduleId', 'title order')
    .lean();

  if (!assessment) {
    const error = new Error('Assessment not found or unavailable');
    error.statusCode = 404;
    throw error;
  }

  const questionsCount = await Question.countDocuments({
    assessmentId: assessment._id,
    isActive: true,
  });

  // Fetch previous student attempts if authenticated
  let previousAttempts = [];
  let inProgressAttempt = null;
  let attemptsUsed = 0;
  let bestScore = null;
  let bestPercentage = null;
  let hasPassed = false;

  if (studentId) {
    const attempts = await AssessmentAttempt.find({
      assessmentId: assessment._id,
      studentId,
    })
      .sort({ createdAt: -1 })
      .lean();

    attemptsUsed = attempts.length;
    inProgressAttempt = attempts.find((a) => a.status === 'IN_PROGRESS') || null;

    const submitted = attempts.filter((a) => a.status === 'SUBMITTED');
    if (submitted.length > 0) {
      const highest = submitted.reduce((prev, curr) =>
        (curr.percentage || 0) > (prev.percentage || 0) ? curr : prev
      );
      bestScore = highest.score;
      bestPercentage = highest.percentage;
      hasPassed = submitted.some((a) => a.passed);
    }

    previousAttempts = attempts.map((a) => ({
      _id: a._id,
      attemptNumber: a.attemptNumber,
      status: a.status,
      score: a.score,
      percentage: a.percentage,
      passed: a.passed,
      startedAt: a.startedAt,
      submittedAt: a.submittedAt,
      timeSpent: a.timeSpent,
    }));
  }

  const canAttempt =
    !assessment.maxAttempts ||
    assessment.maxAttempts === 0 ||
    attemptsUsed < assessment.maxAttempts ||
    !!inProgressAttempt;

  return {
    ...assessment,
    questionCount: questionsCount,
    attemptsUsed,
    canAttempt,
    inProgressAttemptId: inProgressAttempt ? inProgressAttempt._id : null,
    bestScore,
    bestPercentage,
    hasPassed,
    previousAttempts,
  };
}

module.exports = {
  getAssessments,
  getAssessmentById,
};
