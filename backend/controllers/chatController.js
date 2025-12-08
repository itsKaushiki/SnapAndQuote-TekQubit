const { ChatGoogleGenerativeAI } = require('@langchain/google-genai');
const axios = require('axios');
require('dotenv').config();

// Configuration
const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.2'; // or 'mistral', 'phi3', etc.
const USE_OLLAMA = process.env.USE_OLLAMA !== 'false'; // Default to true if not explicitly disabled

// Initialize Gemini LLM (fallback)
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

// Check if Ollama is available
async function checkOllamaAvailable() {
  try {
    const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, {
      timeout: 2000
    });
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

// Process query with Ollama
async function processWithOllama(userInput, report) {
  try {
    let prompt = `You are an expert automotive repair assistant. Answer this question: ${userInput}`;
    
    if (report) {
      // Extract key information from report instead of sending entire JSON
      let damageInfo = '';
      if (report.costBreakdown && Array.isArray(report.costBreakdown)) {
        const parts = report.costBreakdown.map(item => `${item.part}: ₹${item.cost || item.originalCost || 0}`).join(', ');
        damageInfo = `Damaged parts and costs: ${parts}. `;
      }
      if (report.valuation && report.valuation.preliminaryValue) {
        damageInfo += `Total repair cost: ₹${report.valuation.preliminaryValue}. `;
      }
      if (report.location) {
        damageInfo += `Location: ${report.location.city || 'N/A'}. `;
      }
      
      prompt = `You are an expert automotive repair assistant. ${damageInfo}User question: ${userInput}\n\nAnswer based on the damage information and your automotive expertise. Keep your response concise and helpful.`;
    }

    console.log('📤 Sending prompt to Ollama (length:', prompt.length, 'chars)');
    
    const response = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
      model: OLLAMA_MODEL,
      prompt: prompt,
      stream: false,
      options: {
        temperature: 0.3,
        num_predict: 300 // Reduced from 500 for faster response
      }
    }, {
      timeout: 60000 // Increased to 60 second timeout
    });

    const finalResponse = response.data.response || 'No response generated';
    console.log('✅ Ollama response:', finalResponse);
    return finalResponse;
    
  } catch (error) {
    console.error('❌ Ollama error:', error.message);
    throw error;
  }
}

// Process query with Gemini (fallback)
async function processWithGemini(userInput, report) {
  try {
    const model = await initializeChatbot();
    
    let prompt = `You are an expert automotive repair assistant. Answer this question: ${userInput}`;
    
    if (report) {
      // Extract key information from report instead of sending entire JSON
      let damageInfo = '';
      if (report.costBreakdown && Array.isArray(report.costBreakdown)) {
        const parts = report.costBreakdown.map(item => `${item.part}: ₹${item.cost || item.originalCost || 0}`).join(', ');
        damageInfo = `Damaged parts and costs: ${parts}. `;
      }
      if (report.valuation && report.valuation.preliminaryValue) {
        damageInfo += `Total repair cost: ₹${report.valuation.preliminaryValue}. `;
      }
      if (report.location) {
        damageInfo += `Location: ${report.location.city || 'N/A'}. `;
      }
      
      prompt = `You are an expert automotive repair assistant. ${damageInfo}User question: ${userInput}\n\nAnswer based on the damage information and your automotive expertise. Keep your response concise and helpful.`;
    }
    
    console.log('📤 Sending prompt to Gemini (length:', prompt.length, 'chars)');
    
    // Add timeout wrapper for Gemini
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Gemini request timeout after 45000ms')), 45000);
    });
    
    const modelPromise = model.invoke(prompt);
    const response = await Promise.race([modelPromise, timeoutPromise]);
    
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

async function processUserQuery(userInput, report) {
  // Try Ollama first if enabled
  if (USE_OLLAMA) {
    const ollamaAvailable = await checkOllamaAvailable();
    if (ollamaAvailable) {
      try {
        return await processWithOllama(userInput, report);
      } catch (error) {
        console.warn('⚠️ Ollama failed, falling back to Gemini:', error.message);
        // Fall through to Gemini
      }
    } else {
      console.log('ℹ️ Ollama not available, using Gemini');
    }
  }

  // Fallback to Gemini
  return await processWithGemini(userInput, report);
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

    // Determine provider
    const ollamaAvailable = USE_OLLAMA && await checkOllamaAvailable();
    const provider = ollamaAvailable ? `ollama:${OLLAMA_MODEL}` : 'gemini-2.0-flash';

    console.log('✅ Response generated');
    res.json({
      answer: response, // Frontend expects 'answer' field
      response: response, // Also include 'response' for compatibility
      timestamp: new Date().toISOString(),
      provider: provider
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