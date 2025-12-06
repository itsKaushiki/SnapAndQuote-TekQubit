const express = require('express');
const router = express.Router();
const { ensureGemini } = require('../controllers/chatController');

// GET /api/chat/models - list available Gemini models (server-side discovery)
router.get('/', async (req, res) => {
  try {
    const client = ensureGemini();
    if (!client) return res.status(400).json({ message: 'GEMINI_API_KEY missing or Gemini client init failed' });
    if (typeof client.listModels !== 'function') return res.status(400).json({ message: 'Gemini client does not support listModels' });
    const list = await client.listModels();
    return res.json({ models: list.models || list });
  } catch (e) {
    console.error('[ChatModels] Error listing Gemini models:', e?.message || e);
    return res.status(500).json({ message: 'Failed to list Gemini models', error: e?.message || e });
  }
});

module.exports = router;
