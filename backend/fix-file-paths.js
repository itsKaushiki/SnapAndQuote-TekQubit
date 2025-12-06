// Fix file paths in existing test reports
const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

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

const Report = mongoose.model('Report', reportSchema);

async function fixFilePaths() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Update file paths to be absolute paths
    const reportsDir = path.join(__dirname, 'reports');
    
    await Report.updateMany(
      { fileName: 'Sample-Honda-Civic-Report.pdf' },
      { $set: { filePath: path.join(reportsDir, 'sample-report.pdf') } }
    );
    
    await Report.updateMany(
      { fileName: 'Sample-Toyota-Camry-Report.pdf' },
      { $set: { filePath: path.join(reportsDir, 'sample-report-2.pdf') } }
    );

    console.log('✅ File paths updated successfully');

    // Show current reports
    const reports = await Report.find();
    console.log('\nCurrent reports:');
    reports.forEach(report => {
      console.log(`ID: ${report.reportId}`);
      console.log(`File: ${report.fileName}`);
      console.log(`Path: ${report.filePath}`);
      console.log(`Car: ${report.carInfo.year} ${report.carInfo.name} ${report.carInfo.model}`);
      console.log(`Total Cost: ₹${report.totalCost}`);
      console.log('---');
    });

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error fixing file paths:', error);
  }
}

fixFilePaths();