const { AIConversation } = require('../../models/aiConversation.model');
const { AIMessage } = require('../../models/aiMessage.model');
const { Course } = require('../../models/course.model');
const Module = require('../../models/module.model');
const { Lesson } = require('../../models/lesson.model');
const { Problem } = require('../../models/problem.model');
const Assessment = require('../../models/assessment.model');
const AssessmentAttempt = require('../../models/assessmentAttempt.model');
const { Enrollment } = require('../../models/enrollment.model');
const { Submission } = require('../../models/submission.model');

const { getAIProvider } = require('./providers');
const ragService = require('./rag/rag.service');
const { buildTutorSystemPrompt } = require('./prompts/tutor.prompt');
const { buildHintPrompt } = require('./prompts/hint.prompt');
const { buildCodeReviewPrompt } = require('./prompts/codeReview.prompt');
const { buildExplainErrorPrompt } = require('./prompts/explainError.prompt');
const { buildSummarizePrompt } = require('./prompts/summarize.prompt');
const { buildStudyPlanPrompt } = require('./prompts/studyPlan.prompt');
const { buildPracticeGenPrompt } = require('./prompts/practiceGen.prompt');

class AIService {
  /**
   * Retrieves paginated conversations for authenticated student
   */
  async getConversations(studentId, { page = 1, limit = 20 } = {}) {
    const skip = (page - 1) * limit;
    const [conversations, total] = await Promise.all([
      AIConversation.find({ studentId })
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      AIConversation.countDocuments({ studentId }),
    ]);

    return {
      conversations,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Creates a new conversation
   */
  async createConversation(studentId, { title, mode = 'GUIDED', context = {} }) {
    const conversation = await AIConversation.create({
      studentId,
      title: title || 'New Learning Chat',
      mode,
      context,
      lastMessageAt: new Date(),
    });

    return conversation;
  }

  /**
   * Gets conversation details and message history
   */
  async getConversationById(studentId, conversationId) {
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      studentId,
    }).lean();

    if (!conversation) {
      const err = new Error('Conversation not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    const messages = await AIMessage.find({ conversationId })
      .sort({ createdAt: 1 })
      .lean();

    return {
      conversation,
      messages,
    };
  }

  /**
   * Deletes a conversation and all its messages
   */
  async deleteConversation(studentId, conversationId) {
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      studentId,
    });

    if (!conversation) {
      const err = new Error('Conversation not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    await Promise.all([
      AIConversation.deleteOne({ _id: conversationId }),
      AIMessage.deleteMany({ conversationId }),
    ]);

    return { message: 'Conversation deleted successfully' };
  }

  /**
   * Resolves educational context details safely
   */
  async resolveContextDetails(context = {}) {
    const resolved = { ...context };

    if (context.courseId) {
      const c = await Course.findById(context.courseId).select('title slug').lean();
      if (c) resolved.courseTitle = c.title;
    }
    if (context.moduleId) {
      const m = await Module.findById(context.moduleId).select('title').lean();
      if (m) resolved.moduleTitle = m.title;
    }
    if (context.lessonId) {
      const l = await Lesson.findById(context.lessonId).select('title type').lean();
      if (l) resolved.lessonTitle = l.title;
    }
    if (context.problemId) {
      const p = await Problem.findById(context.problemId).select('title difficulty').lean();
      if (p) {
        resolved.problemTitle = p.title;
        resolved.difficulty = p.difficulty;
      }
    }

    return resolved;
  }

  /**
   * Sends a message within a conversation (Synchronous response)
   */
  async sendMessage(studentId, conversationId, { message, context = {}, mode }) {
    const conversation = await AIConversation.findOne({
      _id: conversationId,
      studentId,
    });

    if (!conversation) {
      const err = new Error('Conversation not found or unauthorized');
      err.statusCode = 404;
      throw err;
    }

    const activeMode = mode || conversation.mode || 'GUIDED';

    // Merge conversation context with incoming context
    const mergedContext = {
      ...(conversation.context ? conversation.context.toObject() : {}),
      ...context,
    };

    // Assessment Anti-Cheat Check:
    // If assessment context exists, check if there is an active (in-progress) attempt
    if (mergedContext.assessmentId) {
      const activeAttempt = await AssessmentAttempt.findOne({
        studentId,
        assessmentId: mergedContext.assessmentId,
        status: 'IN_PROGRESS',
      });
      if (activeAttempt) {
        mergedContext.isActiveAssessment = true;
      }
    }

    // Resolve human-readable titles for context
    const resolvedContext = await this.resolveContextDetails(mergedContext);

    // Retrieve RAG chunks
    const ragChunks = await ragService.retrieveContext(message, mergedContext, 3);

    // Save student user message
    const userMessage = await AIMessage.create({
      conversationId,
      studentId,
      role: 'USER',
      content: message,
      context: resolvedContext,
    });

    // Load recent conversation history (last 8 messages for context window management)
    const history = await AIMessage.find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();
    history.reverse();

    // Build system prompt
    const systemPrompt = buildTutorSystemPrompt({
      mode: activeMode,
      context: resolvedContext,
      ragChunks,
    });

    const provider = getAIProvider();
    const aiResult = await provider.generateResponse({
      systemPrompt,
      messages: history,
    });

    // Save assistant message
    const assistantMessage = await AIMessage.create({
      conversationId,
      studentId,
      role: 'ASSISTANT',
      content: aiResult.content,
      context: resolvedContext,
      tokenUsage: aiResult.tokenUsage,
    });

    // Update conversation metadata & generate title if default
    let updateFields = {
      lastMessageAt: new Date(),
      context: mergedContext,
      mode: activeMode,
    };

    if (conversation.title === 'New Learning Chat') {
      const autoTitle = message.slice(0, 35) + (message.length > 35 ? '...' : '');
      updateFields.title = autoTitle;
    }

    await AIConversation.updateOne({ _id: conversationId }, { $set: updateFields });

    return {
      userMessage,
      assistantMessage,
      ragSources: ragChunks.map((c) => ({ title: c.title, score: c.score })),
    };
  }

  /**
   * Generates a progressive hint for coding problems (Tier 1 to 4)
   */
  async getHint({ studentId, problemId, tier = 1, currentCode, language }) {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      const err = new Error('Coding problem not found');
      err.statusCode = 404;
      throw err;
    }

    const prompt = buildHintPrompt({
      problem,
      tier: Number(tier),
      currentCode,
      language: language || 'javascript',
    });

    const provider = getAIProvider();
    const result = await provider.generateResponse({
      systemPrompt: prompt,
      messages: [{ role: 'user', content: `Give me Hint ${tier}` }],
    });

    return {
      problemId,
      tier: Number(tier),
      hint: result.content,
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Explains a code error (diagnostic breakdown)
   */
  async explainError({ studentId, problemId, code, language, error, stderr }) {
    let problem = null;
    if (problemId) {
      problem = await Problem.findById(problemId);
    }

    const prompt = buildExplainErrorPrompt({
      problem,
      code,
      language: language || 'javascript',
      error,
      stderr,
    });

    const provider = getAIProvider();
    const result = await provider.generateResponse({
      systemPrompt: prompt,
      messages: [{ role: 'user', content: 'Explain this error' }],
    });

    return {
      explanation: result.content,
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Performs AI Code Review
   */
  async reviewCode({ studentId, problemId, code, language, executionResult }) {
    const problem = await Problem.findById(problemId);
    if (!problem) {
      const err = new Error('Coding problem not found');
      err.statusCode = 404;
      throw err;
    }

    const prompt = buildCodeReviewPrompt({
      problem,
      code,
      language: language || 'javascript',
      executionResult,
    });

    const provider = getAIProvider();
    const result = await provider.generateResponse({
      systemPrompt: prompt,
      messages: [{ role: 'user', content: 'Review this code submission' }],
    });

    return {
      problemId,
      review: result.content,
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Summarizes a lesson
   */
  async summarizeLesson({ studentId, lessonId }) {
    const lesson = await Lesson.findById(lessonId);
    if (!lesson) {
      const err = new Error('Lesson not found');
      err.statusCode = 404;
      throw err;
    }

    const course = await Course.findById(lesson.courseId);
    const prompt = buildSummarizePrompt({ lesson, course });

    const provider = getAIProvider();
    const result = await provider.generateResponse({
      systemPrompt: prompt,
      messages: [{ role: 'user', content: `Summarize the lesson "${lesson.title}"` }],
    });

    return {
      lessonId,
      summary: result.content,
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Generates a personalized study plan
   */
  async generateStudyPlan({ studentId, targetSkill, availableHours, targetDate, currentLevel }) {
    const [enrollments, solvedCount] = await Promise.all([
      Enrollment.find({ studentId, status: 'ACTIVE' }).populate('courseId').limit(5).lean(),
      Submission.countDocuments({ studentId, verdict: 'ACCEPTED' }),
    ]);

    const courses = enrollments.map((e) => e.courseId).filter(Boolean);

    const prompt = buildStudyPlanPrompt({
      targetSkill,
      availableHours,
      targetDate,
      currentLevel,
      enrolledCourses: courses,
      solvedCount,
    });

    const provider = getAIProvider();
    const result = await provider.generateResponse({
      systemPrompt: prompt,
      messages: [{ role: 'user', content: 'Generate my personalized study plan' }],
    });

    return {
      studyPlan: result.content,
      tokenUsage: result.tokenUsage,
    };
  }

  /**
   * Generates practice quiz questions
   */
  async generatePracticeQuestions({ topic, difficulty = 'MEDIUM', count = 3 }) {
    const prompt = buildPracticeGenPrompt({ topic, difficulty, count });
    const provider = getAIProvider();
    const result = await provider.generateResponse({
      systemPrompt: prompt,
      messages: [{ role: 'user', content: `Generate ${count} practice questions on ${topic}` }],
    });

    // Try parsing JSON or provide structured questions
    let questions = [];
    try {
      const clean = result.content.replace(/```json|```/g, '').trim();
      questions = JSON.parse(clean);
    } catch (e) {
      questions = [
        {
          question: `What is a key best practice when working with ${topic}?`,
          options: [
            'Avoid mutable shared state where possible',
            'Always use global variables',
            'Disable all linting rules',
            'Ignore asynchronous promises',
          ],
          correctIndex: 0,
          explanation: 'Avoiding mutable state makes applications much easier to reason about and test.',
        },
      ];
    }

    return {
      topic,
      difficulty,
      questions,
    };
  }

  /**
   * Records student feedback on an AI message
   */
  async submitFeedback(studentId, messageId, { rating, reason }) {
    const message = await AIMessage.findOne({ _id: messageId });
    if (!message) {
      const err = new Error('Message not found');
      err.statusCode = 404;
      throw err;
    }

    message.feedback = {
      rating,
      reason: reason || null,
      submittedAt: new Date(),
    };

    await message.save();
    return { message: 'Feedback recorded successfully' };
  }
}

module.exports = new AIService();
