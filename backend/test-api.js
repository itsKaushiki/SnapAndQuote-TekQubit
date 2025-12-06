// Simple API test to verify download and delete functionality
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function testHistoryAPI() {
  try {
    console.log('🧪 Testing History API endpoints...\n');

    // Test 1: Get report history
    console.log('1️⃣ Testing GET /api/history');
    const historyResponse = await axios.get(`${BASE_URL}/api/history`);
    console.log(`✅ Status: ${historyResponse.status}`);
    console.log(`📊 Found ${historyResponse.data.reports.length} reports`);
    
    if (historyResponse.data.reports.length === 0) {
      console.log('❌ No reports found in history');
      return;
    }

    const firstReport = historyResponse.data.reports[0];
    console.log(`📋 First Report: ${firstReport.carInfo.year} ${firstReport.carInfo.name} ${firstReport.carInfo.model}`);
    console.log(`💰 Total Cost: ₹${firstReport.totalCost}`);
    console.log(`🔗 Report ID: ${firstReport.reportId}\n`);

    // Test 2: Test download endpoint
    console.log('2️⃣ Testing GET /api/history/download/:reportId');
    try {
      const downloadResponse = await axios.get(`${BASE_URL}/api/history/download/${firstReport.reportId}`, {
        responseType: 'stream'
      });
      
      console.log(`✅ Download Status: ${downloadResponse.status}`);
      console.log(`📄 Content-Type: ${downloadResponse.headers['content-type']}`);
      console.log(`📎 Content-Disposition: ${downloadResponse.headers['content-disposition']}`);
      
      // Save test file to verify download works
      const testFilePath = path.join(__dirname, 'test-download.pdf');
      const writer = fs.createWriteStream(testFilePath);
      downloadResponse.data.pipe(writer);
      
      await new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
      
      const fileSize = fs.statSync(testFilePath).size;
      console.log(`💾 Downloaded file size: ${fileSize} bytes`);
      
      // Clean up test file
      fs.unlinkSync(testFilePath);
      console.log('🧹 Test file cleaned up\n');
      
    } catch (downloadError) {
      console.error('❌ Download test failed:', downloadError.response?.status, downloadError.response?.statusText);
      console.error('Error details:', downloadError.response?.data);
    }

    // Test 3: Verify all reports have valid file paths
    console.log('3️⃣ Checking file existence for all reports');
    for (const report of historyResponse.data.reports) {
      const filePath = report.filePath;
      const exists = fs.existsSync(filePath);
      console.log(`${exists ? '✅' : '❌'} ${report.fileName}: ${filePath}`);
    }
    
    console.log('\n🎉 API tests completed!');

  } catch (error) {
    console.error('❌ API test failed:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

testHistoryAPI();