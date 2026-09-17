const mongoose = require('mongoose');
const { Problem } = require('../../models/problem.model');
const { TestCase } = require('../../models/testCase.model');
const Submission = require('../../models/submission.model');
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
 * List coding problems authored by instructor
 */
const getInstructorProblems = async (instructorId, {
  page = 1,
  limit = 12,
  search = '',
  difficulty = 'all',
  category = 'all',
}) => {
  const pageNum = Math.max(1, parseInt(page, 10));
  const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
  const skip = (pageNum - 1) * limitNum;

  const query = {
    $or: [{ createdBy: instructorId }, { createdBy: { $exists: false } }],
  };

  if (difficulty && difficulty !== 'all') {
    query.difficulty = difficulty.toUpperCase();
  }

  if (category && category !== 'all') {
    query.category = category.toUpperCase();
  }

  if (search && search.trim()) {
    query.$or = [
      { title: { $regex: search.trim(), $options: 'i' } },
      { slug: { $regex: search.trim(), $options: 'i' } },
    ];
  }

  const [problems, total] = await Promise.all([
    Problem.find(query).sort({ updatedAt: -1 }).skip(skip).limit(limitNum).lean(),
    Problem.countDocuments(query),
  ]);

  // Augment with test case count & submission stats
  const problemIds = problems.map((p) => p._id);
  const [testCases, submissionStats] = await Promise.all([
    TestCase.aggregate([
      { $match: { problemId: { $in: problemIds } } },
      {
        $group: {
          _id: '$problemId',
          totalTests: { $sum: 1 },
          hiddenTests: { $sum: { $cond: ['$isHidden', 1, 0] } },
          publicTests: { $sum: { $cond: ['$isHidden', 0, 1] } },
        },
      },
    ]),
    Submission.aggregate([
      { $match: { problemId: { $in: problemIds } } },
      {
        $group: {
          _id: '$problemId',
          totalSubmissions: { $sum: 1 },
          acceptedSubmissions: { $sum: { $cond: [{ $eq: ['$verdict', 'ACCEPTED'] }, 1, 0] } },
        },
      },
    ]),
  ]);

  const tcMap = new Map(testCases.map((tc) => [tc._id.toString(), tc]));
  const subMap = new Map(submissionStats.map((s) => [s._id.toString(), s]));

  const enriched = problems.map((p) => {
    const pid = p._id.toString();
    const tc = tcMap.get(pid) || { totalTests: 0, hiddenTests: 0, publicTests: 0 };
    const sub = subMap.get(pid) || { totalSubmissions: 0, acceptedSubmissions: 0 };
    const rate = sub.totalSubmissions > 0 ? Math.round((sub.acceptedSubmissions / sub.totalSubmissions) * 100) : 0;

    return {
      ...p,
      testCaseStats: tc,
      totalSubmissions: sub.totalSubmissions,
      acceptedSubmissions: sub.acceptedSubmissions,
      acceptanceRate: rate,
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
 * Create a new coding problem
 */
const createProblem = async (instructorId, data) => {
  const {
    title,
    slug,
    description,
    category = 'JAVASCRIPT',
    difficulty = 'EASY',
    topics = [],
    supportedLanguages = ['javascript', 'python'],
    starterCode = {},
    functionSignature,
    inputFormat = '',
    outputFormat = '',
    constraints = '',
    examples = [],
    hints = [],
    solutionExplanation = '',
  } = data;

  if (!title || !description) {
    throw new Error('Problem title and description are required.');
  }

  const finalSlug = slug ? slugify(slug) : slugify(title);
  const existing = await Problem.findOne({ slug: finalSlug });
  if (existing) {
    throw new Error(`A coding problem with slug "${finalSlug}" already exists.`);
  }

  const problem = await Problem.create({
    title,
    slug: finalSlug,
    description,
    category: category.toUpperCase(),
    difficulty: difficulty.toUpperCase(),
    topics: Array.isArray(topics) ? topics : [],
    supportedLanguages: Array.isArray(supportedLanguages) && supportedLanguages.length > 0 ? supportedLanguages : ['javascript'],
    starterCode: starterCode || { javascript: '// Write your solution here\n' },
    functionSignature: functionSignature || { name: 'solution', params: [] },
    inputFormat,
    outputFormat,
    constraints,
    examples: Array.isArray(examples) ? examples : [],
    hints: Array.isArray(hints) ? hints : [],
    solutionExplanation,
    isPublished: false,
    createdBy: instructorId,
  });

  await logAction({
    actorId: instructorId,
    action: 'PROBLEM_CREATED',
    resourceType: 'PROBLEM',
    resourceId: problem._id,
    metadata: { title: problem.title, slug: problem.slug },
  });

  return problem;
};

/**
 * Get coding problem details with ALL test cases (both public and hidden) for the instructor
 */
const getProblemDetail = async (problemId, instructorId) => {
  let problem = null;
  if (mongoose.Types.ObjectId.isValid(problemId)) {
    problem = await Problem.findById(problemId).lean();
  } else {
    problem = await Problem.findOne({ slug: problemId }).lean();
  }

  if (!problem) {
    const err = new Error('Coding problem not found.');
    err.statusCode = 404;
    throw err;
  }

  // Fetch test cases
  const testCases = await TestCase.find({ problemId: problem._id }).sort({ isHidden: 1, order: 1 }).lean();

  return {
    ...problem,
    testCases,
  };
};

/**
 * Update coding problem
 */
const updateProblem = async (problemId, instructorId, updateData) => {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    const err = new Error('Coding problem not found.');
    err.statusCode = 404;
    throw err;
  }

  const allowed = [
    'title',
    'slug',
    'description',
    'category',
    'difficulty',
    'topics',
    'supportedLanguages',
    'starterCode',
    'functionSignature',
    'inputFormat',
    'outputFormat',
    'constraints',
    'examples',
    'hints',
    'solutionExplanation',
  ];

  allowed.forEach((field) => {
    if (updateData[field] !== undefined) {
      if (field === 'slug') {
        problem.slug = slugify(updateData.slug);
      } else {
        problem[field] = updateData[field];
      }
    }
  });

  await problem.save();

  await logAction({
    actorId: instructorId,
    action: 'PROBLEM_UPDATED',
    resourceType: 'PROBLEM',
    resourceId: problem._id,
    metadata: { title: problem.title },
  });

  return problem;
};

/**
 * Publish coding problem with validation
 */
const publishProblem = async (problemId, instructorId) => {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    const err = new Error('Coding problem not found.');
    err.statusCode = 404;
    throw err;
  }

  // Validate test cases requirement
  const [publicCount, hiddenCount] = await Promise.all([
    TestCase.countDocuments({ problemId: problem._id, isHidden: false }),
    TestCase.countDocuments({ problemId: problem._id, isHidden: true }),
  ]);

  if (publicCount === 0) {
    const err = new Error('Problem must have at least one public sample test case before publishing.');
    err.statusCode = 400;
    throw err;
  }

  if (hiddenCount === 0) {
    const err = new Error('Problem must have at least one hidden evaluation test case before publishing.');
    err.statusCode = 400;
    throw err;
  }

  problem.isPublished = true;
  await problem.save();

  await logAction({
    actorId: instructorId,
    action: 'PROBLEM_PUBLISHED',
    resourceType: 'PROBLEM',
    resourceId: problem._id,
    metadata: { title: problem.title },
  });

  return problem;
};

/**
 * Unpublish coding problem
 */
const unpublishProblem = async (problemId, instructorId) => {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    const err = new Error('Coding problem not found.');
    err.statusCode = 404;
    throw err;
  }

  problem.isPublished = false;
  await problem.save();

  return problem;
};

/**
 * Delete coding problem and its test cases
 */
const deleteProblem = async (problemId, instructorId) => {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    const err = new Error('Coding problem not found.');
    err.statusCode = 404;
    throw err;
  }

  await TestCase.deleteMany({ problemId: problem._id });
  await Problem.findByIdAndDelete(problem._id);

  await logAction({
    actorId: instructorId,
    action: 'PROBLEM_DELETED',
    resourceType: 'PROBLEM',
    resourceId: problem._id,
    metadata: { title: problem.title },
  });

  return { success: true, message: 'Coding problem and associated test cases deleted.' };
};

/**
 * Add test case to coding problem
 */
const addTestCase = async (problemId, instructorId, testCaseData) => {
  const problem = await Problem.findById(problemId);
  if (!problem) {
    const err = new Error('Coding problem not found.');
    err.statusCode = 404;
    throw err;
  }

  const { input, expectedOutput, isHidden = false, explanation = '', weight = 1, order } = testCaseData;

  if (input === undefined || expectedOutput === undefined) {
    throw new Error('Input and expected output are required.');
  }

  let finalOrder = order;
  if (!finalOrder) {
    const lastTc = await TestCase.findOne({ problemId }).sort({ order: -1 });
    finalOrder = lastTc ? lastTc.order + 1 : 1;
  }

  const testCase = await TestCase.create({
    problemId,
    input: typeof input === 'string' ? input : JSON.stringify(input),
    expectedOutput: typeof expectedOutput === 'string' ? expectedOutput : JSON.stringify(expectedOutput),
    isHidden: !!isHidden,
    explanation,
    weight,
    order: finalOrder,
  });

  return testCase;
};

/**
 * Delete test case
 */
const deleteTestCase = async (problemId, testCaseId, instructorId) => {
  await TestCase.findOneAndDelete({ _id: testCaseId, problemId });
  return { success: true, message: 'Test case deleted.' };
};

module.exports = {
  getInstructorProblems,
  createProblem,
  getProblemDetail,
  updateProblem,
  publishProblem,
  unpublishProblem,
  deleteProblem,
  addTestCase,
  deleteTestCase,
};
