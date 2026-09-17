const express = require('express');
const { getHealth, getReadiness, getLiveness } = require('../../../controllers/health.controller');

const router = express.Router();

router.get('/', getHealth);
router.get('/ready', getReadiness);
router.get('/live', getLiveness);

module.exports = router;
