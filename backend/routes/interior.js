const express = require('express');
const router = express.Router();
const { analyzeInteriorWear } = require('../controllers/interiorController');

router.post('/', analyzeInteriorWear);

module.exports = router;

