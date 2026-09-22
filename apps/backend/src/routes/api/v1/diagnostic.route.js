const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  startDiagnostic,
  submitAnswer,
  getReport,
} = require('../../../controllers/diagnostic.controller');

const router = express.Router();

router.use(authenticate);

router.post('/start', startDiagnostic);
router.post('/submit-answer', submitAnswer);
router.get('/report/:attemptId', getReport);

module.exports = router;
