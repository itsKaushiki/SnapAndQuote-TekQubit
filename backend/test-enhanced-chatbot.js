const axios = require('axios');

const testChatbot = async () => {
    try {
        console.log('🧪 Testing Enhanced AutoFix AI Chatbot...\n');

        // Test 1: Simple general question
        console.log('Test 1: General automotive question');
        const response1 = await axios.post('http://localhost:5000/api/chat', {
            question: 'What should I consider when choosing between OEM and aftermarket parts?'
        });
        
        console.log('Response 1:');
        console.log('- Answer:', response1.data.answer.substring(0, 200) + '...');
        console.log('- Provider:', response1.data.provider);
        console.log('- Enhanced:', response1.data.enhanced);
        console.log('- Context:', response1.data.contextUsed);
        console.log('');

        // Test 2: Question with damage report context
        console.log('Test 2: Question with damage report context');
        const mockContext = {
            carInfo: {
                year: '2020',
                name: 'Honda',
                model: 'City'
            },
            detectedParts: ['bumper', 'headlight'],
            repairAnalysis: [
                {
                    part: 'bumper',
                    severity: 'Moderate',
                    severityPercentage: 25,
                    recommendation: 'Repair',
                    estimatedTime: '2-3 days',
                    complexity: 'Medium'
                },
                {
                    part: 'headlight',
                    severity: 'Minor',
                    severityPercentage: 15,
                    recommendation: 'Replace',
                    estimatedTime: '1 day',
                    complexity: 'Low'
                }
            ],
            totalOEMCost: 45000,
            totalAftermarketCost: 32000,
            state: 'Maharashtra',
            nearestServiceCenters: [
                {
                    name: 'Local Expert Garage',
                    type: 'Local Mechanic',
                    priceRange: 'Budget-Friendly'
                },
                {
                    name: 'Honda Authorized Center',
                    type: 'Global Company - Authorized Dealer',
                    priceRange: 'Premium'
                }
            ]
        };

        const response2 = await axios.post('http://localhost:5000/api/chat', {
            question: 'Based on my damage report, should I go with local mechanics or authorized service centers?',
            context: mockContext
        });

        console.log('Response 2:');
        console.log('- Answer:', response2.data.answer.substring(0, 300) + '...');
        console.log('- Provider:', response2.data.provider);
        console.log('- Enhanced:', response2.data.enhanced);
        console.log('- Context:', response2.data.contextUsed);
        console.log('');

        // Test 3: Cost-related question with context
        console.log('Test 3: Cost analysis question');
        const response3 = await axios.post('http://localhost:5000/api/chat', {
            question: 'How much money can I save with aftermarket parts and what are the trade-offs?',
            context: mockContext
        });

        console.log('Response 3:');
        console.log('- Answer:', response3.data.answer.substring(0, 300) + '...');
        console.log('- Provider:', response3.data.provider);
        console.log('- Enhanced:', response3.data.enhanced);
        console.log('- Savings calculation available:', response3.data.answer.includes('₹'));
        console.log('');

        console.log('✅ All chatbot tests completed successfully!');

    } catch (error) {
        console.error('❌ Chatbot test failed:', error.response?.data || error.message);
    }
};

// Run the test
testChatbot();