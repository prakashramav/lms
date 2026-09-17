const express = require('express');
const careerController = require('../../../controllers/career.controller');
const { authenticate, optionalAuthenticate } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.get('/questions', optionalAuthenticate, careerController.getInterviewQuestions);
router.post('/sessions', authenticate, careerController.startMockInterviewSession);
router.get('/sessions', authenticate, careerController.getStudentSessionHistory);
router.get('/sessions/:sessionId', authenticate, careerController.getInterviewSession);
router.post('/sessions/:sessionId/answer', authenticate, careerController.submitSessionAnswer);

module.exports = router;
