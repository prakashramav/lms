const mongoose = require('mongoose');
const Assessment = require('../../models/assessment.model');
const Question = require('../../models/question.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const { Course } = require('../../models/course.model');
const { logAction } = require('../audit.service');

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * List assessments authored by instructor
 */
const getInstructorAssessments = async (instructorId, {
  page = 1,
  limit = 12,
  search = '',
  status = 'all',
  courseId,
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = {
    $or: [
      { createdBy: instructorId },
    ],
  };

  // Also include assessments attached to instructor's courses
  const instructorCourses = await Course.find({ instructor: instructorId }).select('_id');
  const courseIds = instructorCourses.map((c) => c._id);
  if (courseIds.length > 0) {
    query.$or.push({ courseId: { $in: courseIds } });
  }

  if (status && status !== 'all') {
    query.status = status.toUpperCase();
  }

  if (courseId && mongoose.Types.ObjectId.isValid(courseId)) {
    query.courseId = courseId;
  }

  if (search && search.trim()) {
    query.title = { $regex: search.trim(), $options: 'i' };
  }

  const [assessments, total] = await Promise.all([
    Assessment.find(query)
      .populate('courseId', 'title slug')
      .populate('moduleId', 'title')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Assessment.countDocuments(query),
  ]);

  // Aggregate questions count and attempts
  const assessmentIds = assessments.map((a) => a._id);
  const [questionCounts, attemptStats] = await Promise.all([
    Question.aggregate([
      { $match: { assessmentId: { $in: assessmentIds } } },
      { $group: { _id: '$assessmentId', count: { $sum: 1 } } },
    ]),
    AssessmentAttempt.aggregate([
      { $match: { assessmentId: { $in: assessmentIds }, status: 'SUBMITTED' } },
      {
        $group: {
          _id: '$assessmentId',
          totalAttempts: { $sum: 1 },
          avgScore: { $avg: '$scorePercentage' },
        },
      },
    ]),
  ]);

  const qMap = new Map(questionCounts.map((q) => [q._id.toString(), q.count]));
  const aMap = new Map(attemptStats.map((a) => [a._id.toString(), a]));

  const enriched = assessments.map((a) => {
    const aid = a._id.toString();
    const stats = aMap.get(aid) || { totalAttempts: 0, avgScore: 0 };
    return {
      ...a,
      questionCount: qMap.get(aid) || 0,
      totalAttempts: stats.totalAttempts,
      averageScore: Math.round(stats.avgScore || 0),
    };
  });

  return {
    items: enriched,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Create a new assessment
 */
const createAssessment = async (instructorId, data) => {
  const {
    title,
    slug,
    description = '',
    instructions = 'Read each question carefully.',
    type = 'QUIZ',
    difficulty = 'Beginner',
    timeLimitMinutes = 30,
    passingScorePercentage = 70,
    maxAttempts = 3,
    courseId = null,
    moduleId = null,
    lessonId = null,
    status = 'DRAFT',
  } = data;

  if (!title) {
    throw new Error('Assessment title is required.');
  }

  const finalSlug = slug ? slugify(slug) : slugify(title);
  const existing = await Assessment.findOne({ slug: finalSlug });
  if (existing) {
    throw new Error(`An assessment with slug "${finalSlug}" already exists.`);
  }

  const assessment = await Assessment.create({
    title,
    slug: finalSlug,
    description,
    instructions,
    type,
    difficulty,
    timeLimitMinutes,
    passingScorePercentage,
    maxAttempts,
    courseId: courseId || null,
    moduleId: moduleId || null,
    lessonId: lessonId || null,
    status,
    isPublished: status === 'PUBLISHED',
    createdBy: instructorId,
  });

  await logAction({
    actorId: instructorId,
    action: 'ASSESSMENT_CREATED',
    resourceType: 'ASSESSMENT',
    resourceId: assessment._id,
    metadata: { title: assessment.title },
  });

  return assessment;
};

/**
 * Get assessment details with full questions including correct answers
 */
const getAssessmentDetail = async (assessmentId, instructorId) => {
  let assessment = null;
  if (mongoose.Types.ObjectId.isValid(assessmentId)) {
    assessment = await Assessment.findById(assessmentId)
      .populate('courseId', 'title slug instructor')
      .populate('moduleId', 'title')
      .lean();
  } else {
    assessment = await Assessment.findOne({ slug: assessmentId })
      .populate('courseId', 'title slug instructor')
      .populate('moduleId', 'title')
      .lean();
  }

  if (!assessment) {
    const err = new Error('Assessment not found.');
    err.statusCode = 404;
    throw err;
  }

  const isOwner =
    (assessment.createdBy && assessment.createdBy.toString() === instructorId.toString()) ||
    (assessment.courseId && assessment.courseId.instructor && assessment.courseId.instructor.toString() === instructorId.toString());

  if (!isOwner) {
    const err = new Error('Forbidden. You do not own this assessment.');
    err.statusCode = 403;
    throw err;
  }

  // Fetch full questions with answers for instructor
  const questions = await Question.find({ assessmentId: assessment._id }).sort({ createdAt: 1 }).lean();

  return {
    ...assessment,
    questions,
  };
};

/**
 * Update assessment
 */
const updateAssessment = async (assessmentId, instructorId, updateData) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found.');
    err.statusCode = 404;
    throw err;
  }

  const allowed = [
    'title',
    'slug',
    'description',
    'instructions',
    'type',
    'difficulty',
    'timeLimitMinutes',
    'passingScorePercentage',
    'maxAttempts',
    'courseId',
    'moduleId',
    'lessonId',
    'status',
    'isPublished',
    'shuffleQuestions',
    'showResultsImmediately',
    'showCorrectAnswers',
  ];

  allowed.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (field === 'slug') {
        assessment.slug = slugify(updateData.slug);
      } else {
        assessment[field] = updateData[field];
      }
    }
  });

  if (updateData.status) {
    assessment.isPublished = updateData.status === 'PUBLISHED';
  }

  await assessment.save();

  await logAction({
    actorId: instructorId,
    action: 'ASSESSMENT_UPDATED',
    resourceType: 'ASSESSMENT',
    resourceId: assessment._id,
    metadata: { title: assessment.title, status: assessment.status },
  });

  return assessment;
};

/**
 * Delete assessment
 */
const deleteAssessment = async (assessmentId, instructorId) => {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found.');
    err.statusCode = 404;
    throw err;
  }

  // Delete questions attached to this assessment
  await Question.deleteMany({ assessmentId: assessment._id });
  await Assessment.findByIdAndDelete(assessment._id);

  await logAction({
    actorId: instructorId,
    action: 'ASSESSMENT_DELETED',
    resourceType: 'ASSESSMENT',
    resourceId: assessment._id,
    metadata: { title: assessment.title },
  });

  return { success: true, message: 'Assessment and its questions deleted.' };
};

// ==========================================
// QUESTION BANK OPERATIONS
// ==========================================

/**
 * List / search questions across the question bank
 */
const getQuestionBank = async (instructorId, {
  page = 1,
  limit = 20,
  search = '',
  difficulty = 'all',
  type = 'all',
  assessmentId,
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  // Find assessments owned by this instructor
  const assessments = await Assessment.find({
    $or: [{ createdBy: instructorId }],
  }).select('_id');
  const assessmentIds = assessments.map((a) => a._id);

  const query = {
    assessmentId: { $in: assessmentIds },
  };

  if (assessmentId && mongoose.Types.ObjectId.isValid(assessmentId)) {
    query.assessmentId = assessmentId;
  }

  if (difficulty && difficulty !== 'all') {
    query.difficulty = difficulty;
  }

  if (type && type !== 'all') {
    query.type = type.toUpperCase();
  }

  if (search && search.trim()) {
    query.question = { $regex: search.trim(), $options: 'i' };
  }

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate('assessmentId', 'title slug')
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
    Question.countDocuments(query),
  ]);

  return {
    items: questions,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
};

/**
 * Create a new question under an assessment
 */
const createQuestion = async (instructorId, data) => {
  const {
    assessmentId,
    question,
    type = 'SINGLE_CHOICE',
    options = [],
    correctAnswers = [],
    explanation = '',
    marks = 1,
    difficulty = 'Beginner',
    topic = '',
  } = data;

  if (!assessmentId || !question) {
    throw new Error('Assessment ID and question text are required.');
  }

  if (!Array.isArray(correctAnswers) || correctAnswers.length === 0) {
    throw new Error('At least one correct answer must be specified.');
  }

  const assessment = await Assessment.findById(assessmentId);
  if (!assessment) {
    const err = new Error('Assessment not found.');
    err.statusCode = 404;
    throw err;
  }

  const formattedOptions = Array.isArray(options)
    ? options.map((opt, idx) => ({
        id: opt.id || `opt_${idx + 1}`,
        text: typeof opt === 'string' ? opt : opt.text || '',
      }))
    : [];

  const questionDoc = await Question.create({
    assessmentId,
    question,
    type,
    options: formattedOptions,
    correctAnswers,
    explanation,
    marks,
    difficulty,
    topic,
  });

  // Update total marks on assessment
  const allQuestions = await Question.find({ assessmentId });
  const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
  assessment.totalMarks = totalMarks;
  await assessment.save();

  await logAction({
    actorId: instructorId,
    action: 'QUESTION_CREATED',
    resourceType: 'QUESTION',
    resourceId: questionDoc._id,
    metadata: { assessmentId, question: questionDoc.question },
  });

  return questionDoc;
};

/**
 * Update question
 */
const updateQuestion = async (questionId, instructorId, updateData) => {
  const questionDoc = await Question.findById(questionId);
  if (!questionDoc) {
    const err = new Error('Question not found.');
    err.statusCode = 404;
    throw err;
  }

  const allowed = [
    'question',
    'type',
    'options',
    'correctAnswers',
    'explanation',
    'marks',
    'difficulty',
    'topic',
  ];

  allowed.forEach((field) => {
    if (updateData[field] !== undefined) {
      questionDoc[field] = updateData[field];
    }
  });

  await questionDoc.save();

  // Recalculate assessment total marks
  const allQuestions = await Question.find({ assessmentId: questionDoc.assessmentId });
  const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
  await Assessment.findByIdAndUpdate(questionDoc.assessmentId, { totalMarks });

  return questionDoc;
};

/**
 * Delete question
 */
const deleteQuestion = async (questionId, instructorId) => {
  const questionDoc = await Question.findById(questionId);
  if (!questionDoc) {
    const err = new Error('Question not found.');
    err.statusCode = 404;
    throw err;
  }

  const assessmentId = questionDoc.assessmentId;
  await Question.findByIdAndDelete(questionDoc._id);

  // Recalculate assessment total marks
  const allQuestions = await Question.find({ assessmentId });
  const totalMarks = allQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);
  await Assessment.findByIdAndUpdate(assessmentId, { totalMarks });

  await logAction({
    actorId: instructorId,
    action: 'QUESTION_DELETED',
    resourceType: 'QUESTION',
    resourceId: questionDoc._id,
    metadata: { assessmentId },
  });

  return { success: true, message: 'Question deleted.' };
};

/**
 * Duplicate question into same or another assessment
 */
const duplicateQuestion = async (questionId, targetAssessmentId, instructorId) => {
  const questionDoc = await Question.findById(questionId);
  if (!questionDoc) {
    const err = new Error('Question not found.');
    err.statusCode = 404;
    throw err;
  }

  const targetId = targetAssessmentId || questionDoc.assessmentId;

  const duplicated = await Question.create({
    assessmentId: targetId,
    question: `${questionDoc.question} (Copy)`,
    type: questionDoc.type,
    options: questionDoc.options ? questionDoc.options.map((o) => ({ ...o.toObject() })) : [],
    correctAnswers: [...questionDoc.correctAnswers],
    explanation: questionDoc.explanation,
    marks: questionDoc.marks,
    difficulty: questionDoc.difficulty,
    topic: questionDoc.topic,
  });

  return duplicated;
};

module.exports = {
  getInstructorAssessments,
  createAssessment,
  getAssessmentDetail,
  updateAssessment,
  deleteAssessment,
  getQuestionBank,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  duplicateQuestion,
};
