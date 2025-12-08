const express = require('express');
const { analyzeAudio } = require('../controllers/audioController');

const router = express.Router();

// POST /api/audio - expects { filename } in request body
router.post('/', analyzeAudio);

module.exports = router;

