const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reportId: {
    type: String,
    required: true,
    unique: true
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  carInfo: {
    name: String,
    model: String,
    year: Number
  },
  detectedParts: [{
    name: String,
    confidence: Number
  }],
  costBreakdown: [{
    part: String,
    cost: Number
  }],
  totalCost: {
    type: Number,
    required: true
  },
  originalImage: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  downloadCount: {
    type: Number,
    default: 0
  }
});

module.exports = mongoose.model('Report', reportSchema);