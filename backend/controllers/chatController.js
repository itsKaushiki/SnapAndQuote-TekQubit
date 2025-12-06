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



async function processUserQuery(userInput, report) {
  try {
    const model = await initializeChatbot();
    
    let prompt = `You are an expert automotive repair assistant. Answer this question: ${userInput}`;
    
    if (report) {
      prompt = `You are an expert automotive repair assistant. Here is vehicle damage information: ${JSON.stringify(report)}\n\nUser question: ${userInput}\n\nAnswer based on the damage report and your automotive expertise.`;
    }
    
    console.log('📤 Sending prompt to Gemini:', prompt);
    const response = await model.invoke(prompt);
    console.log('📥 Raw response from Gemini:', response);
    
    // Handle different response formats
    let finalResponse = '';
    if (typeof response === 'string') {
      finalResponse = response;
    } else if (response && response.content) {
      finalResponse = response.content;
    } else if (response && response.text) {
      finalResponse = response.text;
    } else if (response && response.message) {
      finalResponse = response.message;
    } else {
      finalResponse = JSON.stringify(response);
    }
    
    console.log('✅ Final response:', finalResponse);
    return finalResponse || 'No response generated';
    
  } catch (error) {
    console.error('❌ Error processing query:', error);
    return `Error: ${error.message}`;
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