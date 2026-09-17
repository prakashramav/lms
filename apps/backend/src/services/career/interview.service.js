const InterviewQuestion = require('../../models/interviewQuestion.model');
const InterviewSession = require('../../models/interviewSession.model');
const CareerProfile = require('../../models/careerProfile.model');

class InterviewService {
  async getInterviewQuestions(queryParams = {}) {
    const { category, difficulty, role, page = 1, limit = 20 } = queryParams;
    const filter = { status: 'ACTIVE' };

    if (category && category !== 'ALL') filter.category = category.toUpperCase();
    if (difficulty && difficulty !== 'ALL') filter.difficulty = difficulty.toUpperCase();
    if (role && role !== 'ALL') filter.role = new RegExp(role, 'i');

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const take = parseInt(limit, 10);

    const [questions, total] = await Promise.all([
      InterviewQuestion.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(take)
        .lean(),
      InterviewQuestion.countDocuments(filter),
    ]);

    return {
      questions,
      pagination: {
        page: parseInt(page, 10),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  }

  async createInterviewQuestion(questionData, createdBy) {
    const question = await InterviewQuestion.create({
      ...questionData,
      createdBy,
    });
    return question;
  }

  async startMockInterviewSession(studentId, { role = 'Full Stack Developer', category = 'TECHNICAL', difficulty = 'INTERMEDIATE', questionCount = 3 }) {
    const filter = { status: 'ACTIVE' };
    if (category !== 'MOCK_ALL') {
      filter.category = category;
    }

    let questions = await InterviewQuestion.find(filter).limit(15).lean();

    // Fallback if no questions matched exactly
    if (questions.length === 0) {
      questions = await InterviewQuestion.find({ status: 'ACTIVE' }).limit(5).lean();
    }

    // Shuffle and pick questionCount
    const shuffled = questions.sort(() => 0.5 - Math.random()).slice(0, Math.min(questionCount, questions.length));

    const sessionQuestions = shuffled.map((q) => ({
      questionId: q._id,
      question: q.question,
      category: q.category,
      studentAnswer: '',
      feedback: {
        relevance: 0,
        structure: 0,
        clarity: 0,
        technicalCoverage: 0,
        strengths: [],
        missingConcepts: [],
        suggestions: '',
      },
      score: 0,
    }));

    const session = await InterviewSession.create({
      studentId,
      role,
      category,
      difficulty,
      questions: sessionQuestions,
      currentQuestionIndex: 0,
      status: 'IN_PROGRESS',
    });

    return session;
  }

  async submitSessionAnswer(sessionId, studentId, { questionIndex, answer }) {
    const session = await InterviewSession.findOne({ _id: sessionId, studentId });
    if (!session) {
      const error = new Error('Interview session not found or access denied');
      error.statusCode = 404;
      throw error;
    }

    if (session.status !== 'IN_PROGRESS') {
      const error = new Error('This interview session is already finished');
      error.statusCode = 400;
      throw error;
    }

    if (questionIndex < 0 || questionIndex >= session.questions.length) {
      const error = new Error('Invalid question index');
      error.statusCode = 400;
      throw error;
    }

    const currentQ = session.questions[questionIndex];
    currentQ.studentAnswer = answer;
    currentQ.answeredAt = new Date();

    // Evaluate answer against expected topics
    const sourceQuestion = currentQ.questionId
      ? await InterviewQuestion.findById(currentQ.questionId).lean()
      : null;

    const expectedTopics = sourceQuestion && sourceQuestion.expectedTopics
      ? sourceQuestion.expectedTopics
      : ['key concepts', 'trade-offs', 'clear explanation'];

    const answerLower = (answer || '').toLowerCase();
    const strengths = [];
    const missingConcepts = [];

    expectedTopics.forEach((topic) => {
      if (answerLower.includes(topic.toLowerCase())) {
        strengths.push(`Addressed ${topic}`);
      } else {
        missingConcepts.push(topic);
      }
    });

    const lengthBonus = Math.min(25, Math.floor((answer || '').length / 10));
    const topicScore = expectedTopics.length > 0
      ? Math.round((strengths.length / expectedTopics.length) * 55)
      : 40;
    const computedScore = Math.min(100, Math.max(30, 20 + lengthBonus + topicScore));

    currentQ.feedback = {
      relevance: Math.min(100, computedScore + 5),
      structure: (answer || '').length > 100 ? 85 : 60,
      clarity: (answer || '').length > 60 ? 80 : 55,
      technicalCoverage: topicScore,
      strengths: strengths.length > 0 ? strengths : ['Good initial attempt explaining the concept'],
      missingConcepts,
      suggestions: missingConcepts.length > 0
        ? `Consider mentioning: ${missingConcepts.join(', ')} for a more comprehensive answer.`
        : 'Solid technical depth and clear articulation.',
    };
    currentQ.score = computedScore;

    // Check if session is complete
    const allAnswered = session.questions.every((q) => q.studentAnswer && q.studentAnswer.trim().length > 0);
    if (allAnswered || questionIndex === session.questions.length - 1) {
      session.status = 'COMPLETED';
      const totalScore = session.questions.reduce((acc, q) => acc + (q.score || 0), 0);
      session.overallScore = Math.round(totalScore / session.questions.length);
      session.overallFeedback = session.overallScore >= 75
        ? 'Strong technical preparation across evaluated concepts. Keep practicing system edge cases.'
        : 'Good effort. Focus on incorporating key architectural keywords and the STAR structure for behavioral items.';

      // Update student's career profile interview prep status
      await CareerProfile.findOneAndUpdate(
        { studentId },
        {
          $set: { interviewPrepStatus: 'PRACTICED' },
          $inc: { 'assessmentStats.taken': 1 },
        }
      );
    } else {
      session.currentQuestionIndex = questionIndex + 1;
    }

    await session.save();
    return session;
  }

  async getSessionById(sessionId, studentId) {
    const session = await InterviewSession.findOne({ _id: sessionId, studentId }).lean();
    if (!session) {
      const error = new Error('Interview session not found or access denied');
      error.statusCode = 404;
      throw error;
    }
    return session;
  }

  async getStudentSessionHistory(studentId) {
    return InterviewSession.find({ studentId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();
  }
}

module.exports = new InterviewService();
