const express = require('express');
const { detectDamage } = require('../controllers/detectController');

const router = express.Router();

// POST /api/detect - expects { filename } in request body
router.post('/', detectDamage);

module.exports = router;
