const fetch = require('node-fetch');

async function testDeleteAPI() {
  try {
    // First, get all reports to see what we have
    console.log('📋 Fetching current reports...');
    const historyResponse = await fetch('http://localhost:5000/api/history');
    const historyData = await historyResponse.json();
    
    console.log('Current reports:', JSON.stringify(historyData, null, 2));
    
    if (historyData.reports && historyData.reports.length > 0) {
      const firstReport = historyData.reports[0];
      console.log(`\n🗑️ Attempting to delete report: ${firstReport.reportId}`);
      
      const deleteResponse = await fetch(`http://localhost:5000/api/history/${firstReport.reportId}`, {
        method: 'DELETE'
      });
      
      console.log('Delete response status:', deleteResponse.status);
      console.log('Delete response headers:', Object.fromEntries(deleteResponse.headers.entries()));
      
      const deleteData = await deleteResponse.json();
      console.log('Delete response data:', JSON.stringify(deleteData, null, 2));
      
      if (deleteResponse.ok) {
        console.log('✅ Delete succeeded!');
      } else {
        console.log('❌ Delete failed!');
      }
    } else {
      console.log('No reports found to delete');
    }
    
  } catch (error) {
    console.error('❌ Error testing delete API:', error.message);
    console.error('Full error:', error);
  }
}

testDeleteAPI();