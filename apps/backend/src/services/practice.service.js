const mongoose = require('mongoose');
const { Problem } = require('../models/problem.model');
const { TestCase } = require('../models/testCase.model');
const { Submission } = require('../models/submission.model');
const { ProblemDraft } = require('../models/problemDraft.model');
const { ProblemBookmark } = require('../models/problemBookmark.model');
const { executionQueue } = require('./judge/queue');
const { getLanguageConfig, getSupportedLanguages } = require('./judge/languageConfig');

class PracticeService {
  /**
   * Get paginated problem catalog with filters and student progress flags
   */
  async getProblems(query = {}, studentId = null) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 12));
    const skip = (page - 1) * limit;

    const filter = { isPublished: true };

    if (query.category) {
      filter.category = query.category.toUpperCase();
    }
    if (query.difficulty) {
      filter.difficulty = query.difficulty.toUpperCase();
    }
    if (query.language) {
      filter.supportedLanguages = query.language.toLowerCase();
    }
    if (query.topic) {
      filter.topics = { $regex: new RegExp(query.topic, 'i') };
    }
    if (query.search) {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { topics: searchRegex },
      ];
    }

    // Sort order
    let sort = { createdAt: -1 };
    if (query.sort === 'oldest') sort = { createdAt: 1 };
    if (query.sort === 'difficulty_asc') sort = { difficulty: 1 };
    if (query.sort === 'difficulty_desc') sort = { difficulty: -1 };
    if (query.sort === 'submissions') sort = { totalSubmissions: -1 };

    const [problems, total] = await Promise.all([
      Problem.find(filter)
        .select('-solutionExplanation -constraints -hints')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Problem.countDocuments(filter),
    ]);

    // If student is logged in, attach solved and bookmarked statuses
    let solvedProblemIds = new Set();
    let bookmarkedProblemIds = new Set();

    if (studentId) {
      const [acceptedSubmissions, bookmarks] = await Promise.all([
        Submission.find({ studentId, verdict: 'ACCEPTED' }).distinct('problemId'),
        ProblemBookmark.find({ studentId }).distinct('problemId'),
      ]);
      solvedProblemIds = new Set(acceptedSubmissions.map((id) => id.toString()));
      bookmarkedProblemIds = new Set(bookmarks.map((id) => id.toString()));
    }

    // Filter by solved/unsolved/bookmarked if requested
    let decorated = problems.map((p) => {
      const pIdStr = p._id.toString();
      return {
        ...p,
        isSolved: solvedProblemIds.has(pIdStr),
        isBookmarked: bookmarkedProblemIds.has(pIdStr),
        acceptanceRate:
          p.totalSubmissions > 0
            ? Math.round((p.acceptedSubmissions / p.totalSubmissions) * 100)
            : 0,
      };
    });

    if (query.status === 'SOLVED') {
      decorated = decorated.filter((p) => p.isSolved);
    } else if (query.status === 'UNSOLVED') {
      decorated = decorated.filter((p) => !p.isSolved);
    } else if (query.status === 'BOOKMARKED') {
      decorated = decorated.filter((p) => p.isBookmarked);
    }

    return {
      problems: decorated,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get problem details by slug or ID with public test cases (NEVER hidden)
   */
  async getProblemBySlug(slugOrId, studentId = null) {
    const isObjectId = mongoose.Types.ObjectId.isValid(slugOrId);
    const query = isObjectId ? { _id: slugOrId } : { slug: slugOrId };

    const problem = await Problem.findOne(query).lean();
    if (!problem || !problem.isPublished) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    // Fetch ONLY public test cases
    const publicTestCases = await TestCase.find({
      problemId: problem._id,
      isHidden: false,
    })
      .sort({ order: 1 })
      .select('input expectedOutput description order weight')
      .lean();

    let isSolved = false;
    let isBookmarked = false;
    let savedDraft = null;

    if (studentId) {
      const [acceptedSub, bookmark, draft] = await Promise.all([
        Submission.findOne({ studentId, problemId: problem._id, verdict: 'ACCEPTED' }),
        ProblemBookmark.findOne({ studentId, problemId: problem._id }),
        ProblemDraft.findOne({ studentId, problemId: problem._id }),
      ]);
      isSolved = !!acceptedSub;
      isBookmarked = !!bookmark;
      savedDraft = draft ? { language: draft.language, code: draft.code } : null;
    }

    return {
      ...problem,
      testCases: publicTestCases,
      isSolved,
      isBookmarked,
      savedDraft,
    };
  }

  /**
   * Run code against public test cases (or custom input)
   */
  async runCode({ problemId, language, code, customInput, studentId }) {
    const problem = await Problem.findById(problemId).lean();
    if (!problem || !problem.isPublished) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    const langConfig = getLanguageConfig(language);
    if (!langConfig || !langConfig.isAvailable) {
      const err = new Error(`Language "${language}" is not available for execution`);
      err.statusCode = 400;
      throw err;
    }

    let testCases = [];
    if (customInput !== undefined && customInput !== null && customInput.trim() !== '') {
      testCases = [
        {
          _id: new mongoose.Types.ObjectId(),
          input: customInput.trim(),
          expectedOutput: '',
          isHidden: false,
          order: 1,
        },
      ];
    } else {
      testCases = await TestCase.find({
        problemId: problem._id,
        isHidden: false,
      })
        .sort({ order: 1 })
        .lean();
    }

    const job = await executionQueue.addJob({
      studentId,
      problemId: problem._id,
      language: language.toLowerCase(),
      code,
      problem,
      testCases,
      isSubmission: false,
    });

    const result = await executionQueue.waitForJob(job.id, 15000);

    return {
      executionId: job.id,
      status: job.status,
      ...result,
    };
  }

  /**
   * Submit code against all test cases (public + hidden) and create Submission record
   */
  async submitCode({ problemId, language, code, studentId }) {
    const problem = await Problem.findById(problemId);
    if (!problem || !problem.isPublished) {
      const err = new Error('Problem not found');
      err.statusCode = 404;
      throw err;
    }

    const langConfig = getLanguageConfig(language);
    if (!langConfig || !langConfig.isAvailable) {
      const err = new Error(`Language "${language}" is not available for execution`);
      err.statusCode = 400;
      throw err;
    }

    // Retrieve all test cases including hidden
    const allTestCases = await TestCase.find({ problemId: problem._id })
      .sort({ order: 1 })
      .lean();

    const job = await executionQueue.addJob({
      studentId,
      problemId: problem._id,
      language: language.toLowerCase(),
      code,
      problem: problem.toObject(),
      testCases: allTestCases,
      isSubmission: true,
    });

    const result = await executionQueue.waitForJob(job.id, 20000);

    // Create database submission record
    const submission = await Submission.create({
      studentId,
      problemId: problem._id,
      language: language.toLowerCase(),
      code,
      status: 'COMPLETED',
      verdict: result.verdict,
      score: result.score,
      passedTests: result.passedTests,
      totalTests: result.totalTests,
      executionTime: result.executionTime,
      memoryUsed: result.memoryUsed,
      testResults: result.testResults,
      submittedAt: new Date(),
    });

    // Update problem statistics
    problem.totalSubmissions += 1;
    if (result.verdict === 'ACCEPTED') {
      problem.acceptedSubmissions += 1;
    }
    await problem.save();

    return {
      submissionId: submission._id,
      status: submission.status,
      verdict: submission.verdict,
      score: submission.score,
      passedTests: submission.passedTests,
      totalTests: submission.totalTests,
      executionTime: submission.executionTime,
      memoryUsed: submission.memoryUsed,
      testResults: result.testResults, // sanitized test results (no hidden inputs/outputs)
      submittedAt: submission.submittedAt,
    };
  }

  /**
   * Autosave draft code for a problem
   */
  async saveDraft(studentId, problemId, language, code) {
    const draft = await ProblemDraft.findOneAndUpdate(
      { studentId, problemId, language: language.toLowerCase() },
      { code, updatedAt: new Date() },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return draft;
  }

  /**
   * Get student's draft for a problem
   */
  async getDraft(studentId, problemId, language) {
    const query = { studentId, problemId };
    if (language) query.language = language.toLowerCase();
    const draft = await ProblemDraft.findOne(query).sort({ updatedAt: -1 }).lean();
    return draft;
  }

  /**
   * Toggle problem bookmark
   */
  async toggleBookmark(studentId, problemId) {
    const existing = await ProblemBookmark.findOne({ studentId, problemId });
    if (existing) {
      await ProblemBookmark.findByIdAndDelete(existing._id);
      return { isBookmarked: false };
    }
    await ProblemBookmark.create({ studentId, problemId });
    return { isBookmarked: true };
  }

  /**
   * Get student's bookmarked problems
   */
  async getBookmarks(studentId) {
    const bookmarks = await ProblemBookmark.find({ studentId })
      .populate({
        path: 'problemId',
        select: 'title slug category difficulty topics acceptanceRate',
      })
      .sort({ createdAt: -1 })
      .lean();

    return bookmarks
      .filter((b) => b.problemId && b.problemId.isPublished !== false)
      .map((b) => b.problemId);
  }

  /**
   * Get student's submission history
   */
  async getSubmissions(studentId, query = {}) {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(query.limit, 10) || 15));
    const skip = (page - 1) * limit;

    const filter = { studentId };
    if (query.problemId) filter.problemId = query.problemId;
    if (query.language) filter.language = query.language.toLowerCase();
    if (query.verdict) filter.verdict = query.verdict.toUpperCase();

    const [submissions, total] = await Promise.all([
      Submission.find(filter)
        .populate('problemId', 'title slug difficulty category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .select('-code -testResults')
        .lean(),
      Submission.countDocuments(filter),
    ]);

    return {
      submissions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get submission detail by ID (owner only)
   */
  async getSubmissionDetail(submissionId, studentId) {
    const submission = await Submission.findById(submissionId)
      .populate('problemId', 'title slug difficulty category')
      .lean();

    if (!submission) {
      const err = new Error('Submission not found');
      err.statusCode = 404;
      throw err;
    }

    if (submission.studentId.toString() !== studentId.toString()) {
      const err = new Error('Access denied to this submission');
      err.statusCode = 403;
      throw err;
    }

    return submission;
  }

  /**
   * Practice progress and statistics for student dashboard & profile
   */
  async getPracticeProgress(studentId) {
    const [acceptedProblemIds, allSubmissions, totalProblems] = await Promise.all([
      Submission.find({ studentId, verdict: 'ACCEPTED' }).distinct('problemId'),
      Submission.find({ studentId })
        .populate('problemId', 'difficulty topics category')
        .sort({ createdAt: -1 })
        .lean(),
      Problem.countDocuments({ isPublished: true }),
    ]);

    const solvedCount = acceptedProblemIds.length;
    const attemptedCount = new Set(allSubmissions.map((s) => s.problemId?._id?.toString())).size;

    // Difficulty breakdown
    const solvedProblems = await Problem.find({
      _id: { $in: acceptedProblemIds },
    }).select('difficulty topics category');

    const totalEasy = await Problem.countDocuments({ difficulty: 'EASY', isPublished: true });
    const totalMedium = await Problem.countDocuments({ difficulty: 'MEDIUM', isPublished: true });
    const totalHard = await Problem.countDocuments({ difficulty: 'HARD', isPublished: true });

    const solvedEasy = solvedProblems.filter((p) => p.difficulty === 'EASY').length;
    const solvedMedium = solvedProblems.filter((p) => p.difficulty === 'MEDIUM').length;
    const solvedHard = solvedProblems.filter((p) => p.difficulty === 'HARD').length;

    // Topic breakdown
    const topicMap = {};
    solvedProblems.forEach((p) => {
      (p.topics || []).forEach((topic) => {
        topicMap[topic] = (topicMap[topic] || 0) + 1;
      });
    });

    // Coding streak calculation: check unique consecutive days with submissions
    const submissionDates = [
      ...new Set(
        allSubmissions.map((s) => new Date(s.submittedAt).toISOString().split('T')[0])
      ),
    ].sort((a, b) => new Date(b) - new Date(a));

    let streak = 0;
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (submissionDates.includes(today) || submissionDates.includes(yesterday)) {
      let currentCheck = new Date(submissionDates[0]);
      for (const dateStr of submissionDates) {
        const diffDays = Math.round((currentCheck - new Date(dateStr)) / 86400000);
        if (diffDays <= 1) {
          streak++;
          currentCheck = new Date(dateStr);
        } else {
          break;
        }
      }
    }

    return {
      totalProblems,
      solvedCount,
      attemptedCount,
      codingStreak: streak,
      difficulty: {
        easy: { solved: solvedEasy, total: totalEasy },
        medium: { solved: solvedMedium, total: totalMedium },
        hard: { solved: solvedHard, total: totalHard },
      },
      topics: topicMap,
      recentSubmissions: allSubmissions.slice(0, 5),
    };
  }
}

const practiceService = new PracticeService();

module.exports = {
  PracticeService,
  practiceService,
};
