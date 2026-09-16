const Assessment = require('../models/assessment.model');
const Question = require('../models/question.model');
const AssessmentAttempt = require('../models/assessmentAttempt.model');
const { Enrollment } = require('../models/enrollment.model');

/**
 * Strips confidential answer keys from questions before sending to in-progress student
 */
function sanitizeQuestionForPlayer(q) {
  return {
    _id: q._id,
    question: q.question,
    type: q.type,
    options: (q.options || []).map((opt) => ({
      id: opt.id,
      text: opt.text,
    })),
    marks: q.marks || 1,
    difficulty: q.difficulty,
    topic: q.topic,
    order: q.order,
  };
}

/**
 * Start or resume an assessment attempt
 */
async function startAttempt(assessmentId, studentId) {
  const assessment = await Assessment.findById(assessmentId);
  if (!assessment || assessment.status !== 'PUBLISHED') {
    const error = new Error('Assessment is not available or unpublished');
    error.statusCode = 404;
    throw error;
  }

  // If tied to a course, verify active enrollment
  if (assessment.courseId) {
    const enrollment = await Enrollment.findOne({
      courseId: assessment.courseId,
      studentId,
      status: { $in: ['ACTIVE', 'COMPLETED'] },
    });
    if (!enrollment) {
      const error = new Error('You must be enrolled in the course to take this assessment');
      error.statusCode = 403;
      throw error;
    }
  }

  // Check for existing IN_PROGRESS attempt (refresh recovery)
  const activeAttempt = await AssessmentAttempt.findOne({
    assessmentId,
    studentId,
    status: 'IN_PROGRESS',
  });

  const now = Date.now();
  const durationMs = (assessment.duration || 30) * 60 * 1000;

  if (activeAttempt) {
    const elapsed = now - new Date(activeAttempt.startedAt).getTime();
    if (elapsed > durationMs + 30000) {
      // Expired - auto expire
      activeAttempt.status = 'EXPIRED';
      await activeAttempt.save();
    } else {
      // Resume existing attempt
      const questions = await Question.find({
        assessmentId,
        isActive: true,
      }).sort({ order: 1 });

      return {
        attempt: activeAttempt,
        questions: questions.map(sanitizeQuestionForPlayer),
        duration: assessment.duration,
        expiresAt: new Date(new Date(activeAttempt.startedAt).getTime() + durationMs),
        isResumed: true,
      };
    }
  }

  // Check attempt limit
  const previousAttempts = await AssessmentAttempt.find({
    assessmentId,
    studentId,
  });

  if (
    assessment.maxAttempts &&
    assessment.maxAttempts > 0 &&
    previousAttempts.length >= assessment.maxAttempts
  ) {
    const error = new Error(
      `Maximum attempts (${assessment.maxAttempts}) reached for this assessment`
    );
    error.statusCode = 400;
    throw error;
  }

  // Fetch active questions
  const questions = await Question.find({
    assessmentId,
    isActive: true,
  }).sort({ order: 1 });

  if (questions.length === 0) {
    const error = new Error('This assessment has no questions configured yet');
    error.statusCode = 400;
    throw error;
  }

  const attemptNumber = previousAttempts.length + 1;

  const newAttempt = await AssessmentAttempt.create({
    studentId,
    assessmentId,
    startedAt: new Date(),
    status: 'IN_PROGRESS',
    attemptNumber,
    totalQuestions: questions.length,
    answers: [],
  });

  return {
    attempt: newAttempt,
    questions: questions.map(sanitizeQuestionForPlayer),
    duration: assessment.duration,
    expiresAt: new Date(now + durationMs),
    isResumed: false,
  };
}

/**
 * Get in-progress attempt details
 */
async function getAttempt(attemptId, studentId) {
  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    const error = new Error('Assessment attempt not found');
    error.statusCode = 404;
    throw error;
  }

  if (attempt.studentId.toString() !== studentId.toString()) {
    const error = new Error('Unauthorized access to this attempt');
    error.statusCode = 403;
    throw error;
  }

  const assessment = await Assessment.findById(attempt.assessmentId);
  const questions = await Question.find({
    assessmentId: attempt.assessmentId,
    isActive: true,
  }).sort({ order: 1 });

  const durationMs = (assessment?.duration || 30) * 60 * 1000;
  const expiresAt = new Date(new Date(attempt.startedAt).getTime() + durationMs);

  return {
    attempt,
    questions: questions.map(sanitizeQuestionForPlayer),
    duration: assessment?.duration || 30,
    expiresAt,
  };
}

/**
 * Save / Update an answer during an in-progress attempt
 */
async function saveAnswer(attemptId, studentId, { questionId, selectedAnswers }) {
  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    throw error;
  }

  if (attempt.studentId.toString() !== studentId.toString()) {
    const error = new Error('Unauthorized to modify this attempt');
    error.statusCode = 403;
    throw error;
  }

  if (attempt.status !== 'IN_PROGRESS') {
    const error = new Error(`Cannot modify attempt with status: ${attempt.status}`);
    error.statusCode = 400;
    throw error;
  }

  const assessment = await Assessment.findById(attempt.assessmentId);
  const durationMs = (assessment?.duration || 30) * 60 * 1000;
  const elapsed = Date.now() - new Date(attempt.startedAt).getTime();

  // Server-side timer check (+30s grace period for HTTP latency)
  if (elapsed > durationMs + 30000) {
    attempt.status = 'EXPIRED';
    await attempt.save();
    const error = new Error('Assessment time limit has expired. Submission locked.');
    error.statusCode = 400;
    throw error;
  }

  // Validate question belongs to this assessment
  const question = await Question.findOne({
    _id: questionId,
    assessmentId: attempt.assessmentId,
    isActive: true,
  });

  if (!question) {
    const error = new Error('Question not found or does not belong to this assessment');
    error.statusCode = 400;
    throw error;
  }

  // Validate selected options
  const normalizedAnswers = Array.isArray(selectedAnswers)
    ? selectedAnswers.map((a) => a.toString().trim())
    : [selectedAnswers.toString().trim()];

  // Update existing answer or add new
  const existingIdx = attempt.answers.findIndex(
    (ans) => ans.questionId.toString() === questionId.toString()
  );

  if (existingIdx >= 0) {
    attempt.answers[existingIdx].selectedAnswers = normalizedAnswers;
    attempt.answers[existingIdx].answeredAt = new Date();
  } else {
    attempt.answers.push({
      questionId,
      selectedAnswers: normalizedAnswers,
      answeredAt: new Date(),
    });
  }

  attempt.answeredQuestions = attempt.answers.filter(
    (a) => a.selectedAnswers && a.selectedAnswers.length > 0
  ).length;

  await attempt.save();

  return {
    saved: true,
    answeredQuestions: attempt.answeredQuestions,
    totalQuestions: attempt.totalQuestions,
  };
}

/**
 * Submit assessment attempt and evaluate scores server-side
 */
async function submitAttempt(attemptId, studentId) {
  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    throw error;
  }

  if (attempt.studentId.toString() !== studentId.toString()) {
    const error = new Error('Unauthorized submission');
    error.statusCode = 403;
    throw error;
  }

  // Idempotent submission: if already submitted, return existing results
  if (attempt.status === 'SUBMITTED') {
    return {
      attempt,
      result: {
        score: attempt.score,
        percentage: attempt.percentage,
        passed: attempt.passed,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        totalQuestions: attempt.totalQuestions,
        answeredQuestions: attempt.answeredQuestions,
        timeSpent: attempt.timeSpent,
      },
    };
  }

  if (attempt.status !== 'IN_PROGRESS' && attempt.status !== 'EXPIRED') {
    const error = new Error(`Attempt cannot be submitted with status: ${attempt.status}`);
    error.statusCode = 400;
    throw error;
  }

  const assessment = await Assessment.findById(attempt.assessmentId);
  const questions = await Question.find({
    assessmentId: attempt.assessmentId,
    isActive: true,
  });

  let totalMarksAwarded = 0;
  let totalPossibleMarks = 0;
  let correctCount = 0;
  let incorrectCount = 0;

  // Grade each question
  const gradedAnswers = questions.map((q) => {
    const marks = q.marks || 1;
    totalPossibleMarks += marks;

    const studentAns = attempt.answers.find(
      (a) => a.questionId.toString() === q._id.toString()
    );

    const studentSelections = (studentAns?.selectedAnswers || []).map((s) =>
      s.trim().toLowerCase()
    );
    const correctSelections = (q.correctAnswers || []).map((c) =>
      c.trim().toLowerCase()
    );

    let isCorrect = false;

    if (studentSelections.length > 0) {
      if (q.type === 'SINGLE_CHOICE' || q.type === 'TRUE_FALSE') {
        // Single option match
        isCorrect =
          studentSelections.length === 1 &&
          studentSelections[0] === correctSelections[0];
      } else if (q.type === 'MULTIPLE_CHOICE') {
        // Exact match grading strategy
        const sortedStudent = [...studentSelections].sort();
        const sortedCorrect = [...correctSelections].sort();
        isCorrect =
          sortedStudent.length === sortedCorrect.length &&
          sortedStudent.every((val, idx) => val === sortedCorrect[idx]);
      } else {
        // Fallback exact match
        isCorrect =
          studentSelections.length === correctSelections.length &&
          studentSelections.every((val) => correctSelections.includes(val));
      }
    }

    const marksAwarded = isCorrect ? marks : 0;
    if (isCorrect) {
      correctCount += 1;
      totalMarksAwarded += marksAwarded;
    } else if (studentSelections.length > 0) {
      incorrectCount += 1;
    }

    return {
      questionId: q._id,
      selectedAnswers: studentAns?.selectedAnswers || [],
      isCorrect,
      marksAwarded,
      answeredAt: studentAns?.answeredAt || new Date(),
    };
  });

  const percentage =
    totalPossibleMarks > 0
      ? Math.round((totalMarksAwarded / totalPossibleMarks) * 100)
      : 0;

  const passed = percentage >= (assessment?.passingScore || 70);
  const now = new Date();
  const timeSpent = Math.max(
    0,
    Math.floor((now.getTime() - new Date(attempt.startedAt).getTime()) / 1000)
  );

  attempt.status = 'SUBMITTED';
  attempt.submittedAt = now;
  attempt.score = totalMarksAwarded;
  attempt.percentage = percentage;
  attempt.passed = passed;
  attempt.correctAnswers = correctCount;
  attempt.incorrectAnswers = incorrectCount;
  attempt.answeredQuestions = gradedAnswers.filter(
    (a) => a.selectedAnswers && a.selectedAnswers.length > 0
  ).length;
  attempt.totalQuestions = questions.length;
  attempt.timeSpent = timeSpent;
  attempt.answers = gradedAnswers;

  await attempt.save();

  return {
    attempt,
    result: {
      score: totalMarksAwarded,
      totalMarks: totalPossibleMarks,
      percentage,
      passed,
      passingScore: assessment?.passingScore || 70,
      correctAnswers: correctCount,
      incorrectAnswers: incorrectCount,
      unanswered: questions.length - attempt.answeredQuestions,
      totalQuestions: questions.length,
      timeSpent,
      attemptNumber: attempt.attemptNumber,
    },
  };
}

/**
 * Get assessment attempt result summary (strictly authenticated owner only)
 */
async function getAttemptResult(attemptId, studentId) {
  const attempt = await AssessmentAttempt.findById(attemptId).populate(
    'assessmentId',
    'title slug duration passingScore type difficulty'
  );

  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    throw error;
  }

  if (attempt.studentId.toString() !== studentId.toString()) {
    const error = new Error('Access denied to attempt results');
    error.statusCode = 403;
    throw error;
  }

  if (attempt.status !== 'SUBMITTED') {
    const error = new Error('Attempt has not been submitted yet');
    error.statusCode = 400;
    throw error;
  }

  const assessment = attempt.assessmentId;

  return {
    attemptId: attempt._id,
    assessment: {
      id: assessment._id,
      title: assessment.title,
      slug: assessment.slug,
      type: assessment.type,
      difficulty: assessment.difficulty,
      passingScore: assessment.passingScore,
      duration: assessment.duration,
    },
    score: attempt.score,
    percentage: attempt.percentage,
    passed: attempt.passed,
    attemptNumber: attempt.attemptNumber,
    correctAnswers: attempt.correctAnswers,
    incorrectAnswers: attempt.incorrectAnswers,
    answeredQuestions: attempt.answeredQuestions,
    totalQuestions: attempt.totalQuestions,
    unanswered: attempt.totalQuestions - attempt.answeredQuestions,
    timeSpent: attempt.timeSpent,
    submittedAt: attempt.submittedAt,
  };
}

/**
 * Get question-by-question review with explanations (strictly authenticated owner only)
 */
async function getAttemptReview(attemptId, studentId) {
  const attempt = await AssessmentAttempt.findById(attemptId);
  if (!attempt) {
    const error = new Error('Attempt not found');
    error.statusCode = 404;
    throw error;
  }

  if (attempt.studentId.toString() !== studentId.toString()) {
    const error = new Error('Access denied to attempt review');
    error.statusCode = 403;
    throw error;
  }

  if (attempt.status !== 'SUBMITTED') {
    const error = new Error('Attempt must be submitted to review answers');
    error.statusCode = 400;
    throw error;
  }

  const assessment = await Assessment.findById(attempt.assessmentId);
  const questions = await Question.find({
    assessmentId: attempt.assessmentId,
    isActive: true,
  }).sort({ order: 1 });

  const answerMap = new Map();
  attempt.answers.forEach((a) => {
    answerMap.set(a.questionId.toString(), a);
  });

  const reviewQuestions = questions.map((q) => {
    const studentAns = answerMap.get(q._id.toString());
    return {
      id: q._id,
      question: q.question,
      type: q.type,
      marks: q.marks,
      order: q.order,
      options: q.options,
      studentAnswers: studentAns?.selectedAnswers || [],
      correctAnswers: assessment.showCorrectAnswers ? q.correctAnswers : [],
      isCorrect: studentAns?.isCorrect || false,
      marksAwarded: studentAns?.marksAwarded || 0,
      explanation: assessment.showCorrectAnswers ? q.explanation : '',
    };
  });

  return {
    assessment: {
      id: assessment._id,
      title: assessment.title,
      slug: assessment.slug,
      passingScore: assessment.passingScore,
    },
    attempt: {
      id: attempt._id,
      score: attempt.score,
      percentage: attempt.percentage,
      passed: attempt.passed,
      timeSpent: attempt.timeSpent,
      attemptNumber: attempt.attemptNumber,
    },
    questions: reviewQuestions,
  };
}

/**
 * Get complete student assessment history
 */
async function getStudentHistory(studentId, { page = 1, limit = 10 } = {}) {
  const pageNum = Math.max(1, parseInt(page, 10) || 1);
  const limitNum = Math.max(1, Math.min(50, parseInt(limit, 10) || 10));
  const skip = (pageNum - 1) * limitNum;

  const [total, attempts] = await Promise.all([
    AssessmentAttempt.countDocuments({
      studentId,
      status: { $in: ['SUBMITTED', 'EXPIRED'] },
    }),
    AssessmentAttempt.find({
      studentId,
      status: { $in: ['SUBMITTED', 'EXPIRED'] },
    })
      .populate('assessmentId', 'title slug type difficulty passingScore courseId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean(),
  ]);

  return {
    items: attempts,
    page: pageNum,
    limit: limitNum,
    total,
    totalPages: Math.ceil(total / limitNum) || 1,
  };
}

module.exports = {
  startAttempt,
  getAttempt,
  saveAnswer,
  submitAttempt,
  getAttemptResult,
  getAttemptReview,
  getStudentHistory,
};
