const express = require('express');
const { getCommandPaletteResults } = require('../../../controllers/search.controller');

const router = express.Router();

router.get('/command-palette', getCommandPaletteResults);

module.exports = router;
