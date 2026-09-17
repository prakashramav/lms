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

module.exports = router;

