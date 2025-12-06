const express = require('express');
const path = require('path');
const fs = require('fs');
const Report = require('../models/Report');
const router = express.Router();

// POST /api/history/test - Create test report data
router.post('/test', async (req, res) => {
  try {
    const testReport = new Report({
      reportId: `test-${Date.now()}`,
      fileName: 'Test-Report.pdf',
      filePath: path.join(__dirname, '../reports/test-report.pdf'),
      carInfo: {
        name: 'Honda',
        model: 'Civic',
        year: 2020
      },
      detectedParts: [
        { name: 'bumper', confidence: 0.85 },
        { name: 'door', confidence: 0.92 }
      ],
      costBreakdown: [
        { part: 'bumper', cost: 1500 },
        { part: 'door', cost: 2000 }
      ],
      totalCost: 3500,
      originalImage: 'test-image.jpg',
      downloadCount: 0
    });

    await testReport.save();
    res.json({ message: 'Test report created successfully', reportId: testReport.reportId });
  } catch (error) {
    console.error('Error creating test report:', error);
    res.status(500).json({ error: 'Failed to create test report', details: error.message });
  }
});

// GET /api/history - Get all report history
router.get('/', async (req, res) => {
  try {
    console.log('Fetching report history...');
    const reports = await Report.find()
      .sort({ createdAt: -1 }) // Most recent first
      .limit(50); // Limit to 50 most recent reports
    
    console.log(`Found ${reports.length} reports in database`);
    
    // For now, return all reports regardless of file existence to debug
    const reportsWithUrls = reports.map(report => ({
      ...report.toObject(),
      downloadUrl: `/api/history/download/${report.reportId}`
    }));
    
    res.json({
      reports: reportsWithUrls,
      total: reportsWithUrls.length,
      debug: {
        totalInDatabase: reports.length,
        mongoConnected: !!global.mongoose?.connection?.readyState
      }
    });
  } catch (error) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch report history', 
      details: error.message,
      stack: error.stack 
    });
  }
});

// GET /api/history/download/:reportId - Download a specific report
router.get('/download/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    console.log(`Download request for report: ${reportId}`);
    
    const report = await Report.findOne({ reportId });
    
    if (!report) {
      console.log(`Report not found: ${reportId}`);
      return res.status(404).json({ error: 'Report not found' });
    }
    
    const fullPath = path.resolve(report.filePath);
    console.log(`Looking for file at: ${fullPath}`);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`File not found on disk: ${fullPath}`);
      return res.status(404).json({ error: 'Report file not found on disk' });
    }
    
    // Increment download count
    report.downloadCount += 1;
    await report.save();
    console.log(`Download count incremented for report: ${reportId}`);
    
    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${report.fileName}"`);
    
    // Stream the file
    const fileStream = fs.createReadStream(fullPath);
    fileStream.pipe(res);
    
    fileStream.on('error', (err) => {
      console.error('Error streaming file:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Failed to download file' });
      }
    });
    
  } catch (error) {
    console.error('Error downloading report:', error);
    res.status(500).json({ error: 'Failed to download report' });
  }
});

// DELETE /api/history/:reportId - Delete a report from history
router.delete('/:reportId', async (req, res) => {
  try {
    const { reportId } = req.params;
    console.log(`🗑️ DELETE request received for report: ${reportId}`);
    const report = await Report.findOne({ reportId });
    
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }
    
    // Delete file from disk
    const fullPath = path.resolve(report.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    
    // Remove from database
    await Report.deleteOne({ reportId });
    
    console.log(`✅ Report deleted successfully: ${reportId}`);
    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('❌ Error deleting report:', error);
    res.status(500).json({ error: 'Failed to delete report', details: error.message });
  }
});

module.exports = router;