const express = require('express');
const { chat } = require('../controllers/chatController');

const router = express.Router();

// POST /api/chat { question }
router.post('/', chat);

module.exports = router;
