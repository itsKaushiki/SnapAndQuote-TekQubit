const axios = require('axios');

async function testChat() {
  try {
    console.log('🔄 Testing chat API with damage report...');
    
    // Test with sample damage report context
    const sampleReport = {
      carInfo: { name: 'Honda', model: 'Civic', year: '2020' },
      state: 'Maharashtra',
      repairAnalysis: [
        { part: 'bumper', severityPercentage: 75, severity: 'High', recommendation: 'Replace', estimatedTime: '3-4 hours' },
        { part: 'headlight', severityPercentage: 45, severity: 'Medium', recommendation: 'Repair', estimatedTime: '1-2 hours' }
      ],
      totalOEMCost: 25000,
      totalAftermarketCost: 18000
    };
    
    const response = await axios.post('http://localhost:5000/api/chat', {
      question: 'What should I repair first and what will it cost?',
      context: sampleReport
    }, {
      headers: {
        'Content-Type': 'application/json'
      },
      timeout: 30000
    });
    
    console.log('✅ Chat API Response:', response.data);
  } catch (error) {
    console.error('❌ Chat API Error Details:');
    console.error('  Status:', error.response?.status);
    console.error('  Data:', error.response?.data);
    console.error('  Message:', error.message);
    if (error.code) console.error('  Code:', error.code);
  }
}

testChat();