const express = require('express');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');
const { getQueueStatus, retryDLQJob, cancelJob } = require('../../../controllers/queue.controller');

const router = express.Router();

// Admin-only access to operational queue monitoring & DLQ intervention
router.use(authenticate);
router.use(authorize('ADMIN', 'SUPER_ADMIN'));

router.get('/status', getQueueStatus);
router.post('/dlq/:jobId/retry', retryDLQJob);
router.post('/jobs/:jobId/cancel', cancelJob);

module.exports = router;
