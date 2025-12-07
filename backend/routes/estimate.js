const express = require('express');
const router = express.Router();
// Using hybrid controller with OpenAI primary and Gemini fallback
const { estimateCost, getBasePrice } = require('../controllers/estimateHybrid');

router.get('/base-price', getBasePrice);
router.post('/', estimateCost);
module.exports = router;
