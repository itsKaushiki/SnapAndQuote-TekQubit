// Clean up duplicate test reports and keep only the latest ones
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

async function cleanupDuplicates() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log('Connected to MongoDB');

    // Delete all existing test reports
    const deleteResult = await Report.deleteMany({ reportId: { $regex: /^test-report/ } });
    console.log(`Deleted ${deleteResult.deletedCount} test reports`);

    // Create fresh test reports with correct paths
    const reportsDir = 'D:\\AutoFix-AI\\backend\\reports';
    
    const testReport1 = new Report({
      reportId: `honda-civic-${Date.now()}`,
      fileName: 'Honda-Civic-2020-Damage-Report.pdf',
      filePath: `${reportsDir}\\sample-report.pdf`,
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

    const testReport2 = new Report({
      reportId: `toyota-camry-${Date.now()}`,
      fileName: 'Toyota-Camry-2019-Damage-Report.pdf',
      filePath: `${reportsDir}\\sample-report-2.pdf`,
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

    await testReport1.save();
    await testReport2.save();

    console.log('✅ Created fresh test reports');
    console.log('Report 1 ID:', testReport1.reportId);
    console.log('Report 2 ID:', testReport2.reportId);

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');

  } catch (error) {
    console.error('Error cleaning up duplicates:', error);
  }
}

cleanupDuplicates();