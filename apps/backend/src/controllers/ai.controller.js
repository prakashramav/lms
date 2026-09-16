const aiService = require('../services/ai/ai.service');

/**
 * Controller for AI Tutor endpoints
 */
class AIController {
  async getConversations(req, res, next) {
    try {
      const studentId = req.user._id;
      const { page, limit } = req.query;
      const data = await aiService.getConversations(studentId, { page, limit });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async createConversation(req, res, next) {
    try {
      const studentId = req.user._id;
      const { title, mode, context } = req.body;
      const data = await aiService.createConversation(studentId, { title, mode, context });
      res.status(201).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getConversationById(req, res, next) {
    try {
      const studentId = req.user._id;
      const { conversationId } = req.params;
      const data = await aiService.getConversationById(studentId, conversationId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async deleteConversation(req, res, next) {
    try {
      const studentId = req.user._id;
      const { conversationId } = req.params;
      const data = await aiService.deleteConversation(studentId, conversationId);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async sendMessage(req, res, next) {
    try {
      const studentId = req.user._id;
      const { conversationId } = req.params;
      const { message, context, mode } = req.body;
      const isStream = req.query.stream === 'true';

      if (!message || typeof message !== 'string' || message.trim().length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Message content is required',
          errorCode: 'INVALID_INPUT',
        });
      }

      if (message.length > 5000) {
        return res.status(400).json({
          success: false,
          message: 'Message exceeds maximum character length (5,000)',
          errorCode: 'PAYLOAD_TOO_LARGE',
        });
      }

      if (isStream) {
        // Setup SSE Headers
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.flushHeaders?.();

        const result = await aiService.sendMessage(studentId, conversationId, {
          message: message.trim(),
          context,
          mode,
        });

        const words = result.assistantMessage.content.split(' ');
        for (let i = 0; i < words.length; i++) {
          const chunk = (i === 0 ? '' : ' ') + words[i];
          res.write(`data: ${JSON.stringify({ token: chunk, done: false })}\n\n`);
        }
        res.write(`data: ${JSON.stringify({ done: true, messageId: result.assistantMessage._id })}\n\n`);
        return res.end();
      }

      const data = await aiService.sendMessage(studentId, conversationId, {
        message: message.trim(),
        context,
        mode,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async getHint(req, res, next) {
    try {
      const studentId = req.user._id;
      const { problemId, tier, currentCode, language } = req.body;

      if (!problemId) {
        return res.status(400).json({
          success: false,
          message: 'Problem ID is required',
          errorCode: 'MISSING_PARAM',
        });
      }

      const data = await aiService.getHint({
        studentId,
        problemId,
        tier,
        currentCode,
        language,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async explainError(req, res, next) {
    try {
      const studentId = req.user._id;
      const { problemId, code, language, error, stderr } = req.body;

      const data = await aiService.explainError({
        studentId,
        problemId,
        code,
        language,
        error,
        stderr,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async reviewCode(req, res, next) {
    try {
      const studentId = req.user._id;
      const { problemId, code, language, executionResult } = req.body;

      if (!problemId || !code) {
        return res.status(400).json({
          success: false,
          message: 'problemId and code are required',
          errorCode: 'MISSING_PARAM',
        });
      }

      const data = await aiService.reviewCode({
        studentId,
        problemId,
        code,
        language,
        executionResult,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async summarizeLesson(req, res, next) {
    try {
      const studentId = req.user._id;
      const { lessonId } = req.body;

      if (!lessonId) {
        return res.status(400).json({
          success: false,
          message: 'lessonId is required',
          errorCode: 'MISSING_PARAM',
        });
      }

      const data = await aiService.summarizeLesson({ studentId, lessonId });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async generateStudyPlan(req, res, next) {
    try {
      const studentId = req.user._id;
      const { targetSkill, availableHours, targetDate, currentLevel } = req.body;

      const data = await aiService.generateStudyPlan({
        studentId,
        targetSkill,
        availableHours,
        targetDate,
        currentLevel,
      });

      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async generatePracticeQuestions(req, res, next) {
    try {
      const { topic, difficulty, count } = req.body;
      if (!topic) {
        return res.status(400).json({
          success: false,
          message: 'Topic is required',
          errorCode: 'MISSING_PARAM',
        });
      }

      const data = await aiService.generatePracticeQuestions({ topic, difficulty, count });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  async submitFeedback(req, res, next) {
    try {
      const studentId = req.user._id;
      const { messageId } = req.params;
      const { rating, reason } = req.body;

      if (!rating || !['HELPFUL', 'UNHELPFUL'].includes(rating)) {
        return res.status(400).json({
          success: false,
          message: 'Rating must be either HELPFUL or UNHELPFUL',
          errorCode: 'INVALID_RATING',
        });
      }

      const data = await aiService.submitFeedback(studentId, messageId, { rating, reason });
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }
}

module.exports = new AIController();
