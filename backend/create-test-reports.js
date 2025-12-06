// Simple script to create test report data
const mongoose = require('mongoose');
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

async function createTestReport() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    const testReport = new Report({
      reportId: `test-report-${Date.now()}`,
      fileName: 'Sample-Honda-Civic-Report.pdf',
      filePath: '/reports/sample-report.pdf',
      carInfo: {
        name: 'Honda',
        model: 'Civic',
        year: 2020
      },
      detectedParts: [
        { name: 'bumper', confidence: 0.85 },
        { name: 'door', confidence: 0.92 },
        { name: 'headlight', confidence: 0.78 }
      ],
      costBreakdown: [
        { part: 'bumper', cost: 1500 },
        { part: 'door', cost: 2000 },
        { part: 'headlight', cost: 800 }
      ],
      totalCost: 4300,
      originalImage: 'honda-civic-damaged.jpg',
      downloadCount: 0
    });

    await testReport.save();
    console.log('✅ Test report created successfully');
    console.log('Report ID:', testReport.reportId);

    // Create another test report
    const testReport2 = new Report({
      reportId: `test-report-2-${Date.now()}`,
      fileName: 'Sample-Toyota-Camry-Report.pdf',
      filePath: '/reports/sample-report-2.pdf',
      carInfo: {
        name: 'Toyota',
        model: 'Camry',
        year: 2019
      },
      detectedParts: [
        { name: 'fender', confidence: 0.91 },
        { name: 'mirror', confidence: 0.87 }
      ],
      costBreakdown: [
        { part: 'fender', cost: 1800 },
        { part: 'mirror', cost: 500 }
      ],
      totalCost: 2300,
      originalImage: 'toyota-camry-damaged.jpg',
      downloadCount: 0
    });

    await testReport2.save();
    console.log('✅ Second test report created successfully');
    console.log('Report ID:', testReport2.reportId);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error creating test reports:', error);
  }
}

createTestReport();