// backend/routes/estimate.js
const express = require('express');
const router = express.Router();
// Using hybrid controller with OpenAI primary and Gemini fallback
const { estimateCost } = require('../controllers/estimateHybrid');

router.post('/', estimateCost);
module.exports = router;
