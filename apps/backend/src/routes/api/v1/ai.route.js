const express = require('express');
const rateLimit = require('express-rate-limit');
const aiController = require('../../../controllers/ai.controller');
const { authenticate } = require('../../../middlewares/auth.middleware');
const env = require('../../../config/env');

const router = express.Router();

// AI Rate Limiter
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: env.NODE_ENV === 'test' ? 1000 : 60, // 60 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many AI requests. Please slow down.',
    errorCode: 'AI_RATE_LIMIT_EXCEEDED',
  },
  skip: () => env.NODE_ENV === 'test',
});

// All AI routes require authentication and rate limiting
router.use(authenticate);
router.use(aiLimiter);

// Conversations
router.get('/conversations', aiController.getConversations);
router.post('/conversations', aiController.createConversation);
router.get('/conversations/:conversationId', aiController.getConversationById);
router.delete('/conversations/:conversationId', aiController.deleteConversation);
router.post('/conversations/:conversationId/messages', aiController.sendMessage);

// Specialized Educational AI Services
router.post('/hint', aiController.getHint);
router.post('/explain', aiController.explainError);
router.post('/code-review', aiController.reviewCode);
router.post('/summarize', aiController.summarizeLesson);
router.post('/generate-practice', aiController.generatePracticeQuestions);
router.post('/study-plan', aiController.generateStudyPlan);

// Feedback
router.post('/messages/:messageId/feedback', aiController.submitFeedback);

// Phase 12: Career AI
const careerController = require('../../../controllers/career.controller');
router.post('/career/chat', careerController.chatWithCareerAssistant);
router.post('/career/resume-analysis', careerController.analyzeResumeAgainstJob);
router.post('/career/interview-feedback', careerController.evaluateInterviewAnswer);

// Phase 16: AI Tutor 2.0 & Unified Tool Registry
const aiTutorV2 = require('../../../services/ai/aiTutorV2.service');
const { executeAiTool } = require('../../../services/ai/aiToolRegistry');

router.post('/tutor/socratic', async (req, res, next) => {
  try {
    const { concept, studentQuestion, currentContext } = req.body;
    if (!concept || !studentQuestion) {
      return res.status(400).json({ success: false, message: 'concept and studentQuestion are required' });
    }
    const result = await aiTutorV2.generateSocraticQuestion({ concept, studentQuestion, currentContext });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/tutor/teach-back', async (req, res, next) => {
  try {
    const { concept, studentExplanation, targetLevel } = req.body;
    if (!concept || !studentExplanation) {
      return res.status(400).json({ success: false, message: 'concept and studentExplanation are required' });
    }
    const result = await aiTutorV2.evaluateTeachBack({ concept, studentExplanation, targetLevel });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/tutor/explain-level', async (req, res, next) => {
  try {
    const { concept, level, language } = req.body;
    if (!concept) {
      return res.status(400).json({ success: false, message: 'concept is required' });
    }
    const result = await aiTutorV2.explainConceptAtLevel({ concept, level, language });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/tutor/progressive-hint', async (req, res, next) => {
  try {
    const { problemTitle, problemDescription, hintTier, studentCode } = req.body;
    if (!problemTitle || !problemDescription) {
      return res.status(400).json({ success: false, message: 'problemTitle and problemDescription are required' });
    }
    const result = await aiTutorV2.getProgressiveHint({ problemTitle, problemDescription, hintTier, studentCode });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/tutor/explain-code', async (req, res, next) => {
  try {
    const { code, language, focusArea } = req.body;
    if (!code) {
      return res.status(400).json({ success: false, message: 'code is required' });
    }
    const result = await aiTutorV2.explainCodeSafely({ code, language, focusArea });
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

router.post('/assistant/execute-tool', async (req, res, next) => {
  try {
    const { toolName, params } = req.body;
    if (!toolName) {
      return res.status(400).json({ success: false, message: 'toolName is required' });
    }
    const result = await executeAiTool(req.user, toolName, params || {});
    return res.status(200).json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

module.exports = router;

