const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
require('dotenv').config();

// Initialize Gemini LLM
let llm = null;

async function initializeChatbot() {
  if (llm) return llm;
  
  try {
    llm = new ChatGoogleGenerativeAI({
      model: "gemini-2.0-flash-exp",
      apiKey: process.env.GEMINI_API_KEY,
      temperature: 0.3,
      maxOutputTokens: 500
    });

    console.log('✅ Gemini chatbot initialized');
    return llm;
  } catch (error) {
    console.error('❌ Failed to initialize chatbot:', error.message);
    throw error;
  }
}

// -----------------------------
// HELPER FUNCTIONS
// -----------------------------
function formatReportForPrompt(report) {
  /**
   * Format JSON damage report into text for LLM context.
   * Handles both your format and AutoFix AI format
   */
  try {
    let vehicleInfo = '';
    let partsText = '';
    let costInfo = '';

    // Handle different report formats
    if (report.car_model) {
      // Your original format
      vehicleInfo = `Vehicle: ${report.car_model} (State: ${report.state})`;
      
      if (report.damaged_parts && Array.isArray(report.damaged_parts)) {
        partsText = report.damaged_parts.map(p => 
          `- ${p.part.charAt(0).toUpperCase() + p.part.slice(1)}: ${p.damage_percent}% damage, ${p.severity}, estimated cost ₹${p.cost.toLocaleString()}`
        ).join('\n');
      }
      
      costInfo = `Total estimated cost: ₹${report.total_cost?.toLocaleString() || 0}`;
      
    } else {
      // AutoFix AI format
      const carInfo = report.carInfo || {};
      vehicleInfo = `Vehicle: ${carInfo.year || ''} ${carInfo.name || ''} ${carInfo.model || ''} (State: ${report.state || 'Unknown'})`.trim();
      
      if (report.detectedParts && Array.isArray(report.detectedParts)) {
        partsText = report.detectedParts.map(part => `- ${part.charAt(0).toUpperCase() + part.slice(1)}`).join('\n');
      }
      
      if (report.repairAnalysis && Array.isArray(report.repairAnalysis)) {
        partsText = report.repairAnalysis.map(analysis => 
          `- ${analysis.part.charAt(0).toUpperCase() + analysis.part.slice(1)}: ${analysis.severityPercentage}% damage, ${analysis.severity}, Recommendation: ${analysis.recommendation}, Time: ${analysis.estimatedTime}`
        ).join('\n');
      }
      
      if (report.totalOEMCost && report.totalAftermarketCost) {
        const savings = report.totalOEMCost - report.totalAftermarketCost;
        const savingsPercent = ((savings / report.totalOEMCost) * 100).toFixed(1);
        costInfo = `OEM Cost: ₹${report.totalOEMCost.toLocaleString()}, Aftermarket Cost: ₹${report.totalAftermarketCost.toLocaleString()}, Potential Savings: ₹${savings.toLocaleString()} (${savingsPercent}%)`;
      } else {
        costInfo = `Total estimated cost: ₹${report.totalCost?.toLocaleString() || 0}`;
      }
    }

    return `${vehicleInfo}\nDamaged Parts:\n${partsText}\n${costInfo}`;
    
  } catch (error) {
    console.error('Error formatting report:', error);
    return `Error formatting damage report: ${error.message}`;
  }
}

async function processUserQuery(userInput, report) {
  /**
   * Send user query + report context to Gemini and let it answer naturally.
   */
  try {
    const chain = await initializeChatbot();
    const context = formatReportForPrompt(report);
    
    const prompt = `You are an expert automotive repair assistant.\nHere is the vehicle report for context:\n${context}\n\nUser Question: ${userInput}\nAnswer concisely, using your general knowledge as needed.`;
    
    const response = await chain.call({ input: prompt });
    return response.response || response.text || 'No response generated';
    
  } catch (error) {
    console.error('Error processing user query:', error);
    throw new Error(`Failed to process query: ${error.message}`);
  }
}

// Main chat endpoint
async function chat(req, res) {
  console.log('🤖 Chat endpoint called:', req.body);
  
  try {
    const { message, question, reportId, context } = req.body;
    const userInput = message || question;

    if (!userInput) {
      console.log('❌ No message or question provided');
      return res.status(400).json({ error: 'Message or question is required' });
    }

    console.log('📝 User input:', userInput);

    let report = null;
    if (reportId) {
      const Report = require('../models/CarCost');
      report = await Report.findById(reportId);
    }

    console.log('🔄 Processing user query...');
    const response = await processUserQuery(userInput, report || context);

    console.log('✅ Response generated:', response);
    res.json({
      response,
      timestamp: new Date().toISOString(),
      provider: 'gemini-2.0-flash'
    });

  } catch (error) {
    console.error('❌ Chat error:', error);
    res.status(500).json({
      error: error.message || 'Failed to process chat request',
      timestamp: new Date().toISOString()
    });
  }
}

module.exports = { chat };