const express = require('express');
const {
  toggle,
  list,
  remove,
} = require('../../../controllers/bookmark.controller');
const { authenticate, authorize } = require('../../../middlewares/auth.middleware');

const router = express.Router();

router.use(authenticate, authorize('STUDENT'));

router.get('/', list);
router.post('/:lessonId', toggle);
router.delete('/:lessonId', remove);

module.exports = router;
