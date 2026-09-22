const express = require('express');
const { authenticate } = require('../../../middlewares/auth.middleware');
const {
  getPublicShowcases,
  createShowcase,
  getMyShowcases,
  toggleLike,
} = require('../../../controllers/showcase.controller');

const router = express.Router();

// Public showcase discovery
router.get('/', getPublicShowcases);

// Protected endpoints
router.use(authenticate);
router.post('/', createShowcase);
router.get('/my-projects', getMyShowcases);
router.post('/:projectId/like', toggleLike);

module.exports = router;
