const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
const EnhancedChatbot = require('../utils/enhancedChatbot');
require('dotenv').config();

// Initialize enhanced chatbot
const enhancedChatbot = new EnhancedChatbot();

// Ensure fetch exists (Node 18+ has global fetch). Fallback to node-fetch if not.
let fetchImpl = global.fetch;
if (!fetchImpl) {
  try {
    fetchImpl = require('node-fetch');
    global.fetch = fetchImpl;
  } catch (e) {
    console.warn('No global fetch available and node-fetch not installed. Local LLaMA calls may fail.');
  }
}

// Lazy OpenAI client. Only create when API key is available.
function getOpenAI() {
  // Respect PREFERRED_PROVIDER if set: 'openai'|'gemini'|'local'|'deepseek'
  const preferred = (process.env.PREFERRED_PROVIDER || '').toLowerCase();
  if (preferred === 'gemini' || preferred === 'local' || preferred === 'deepseek') return null;
  // If GEMINI_API_KEY exists and no explicit preference for OpenAI, default prefers Gemini
  if (process.env.GEMINI_API_KEY && !process.env.PREFERRED_PROVIDER) return null;
  if (!process.env.OPENAI_API_KEY) return null;
  try {
    return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  } catch (e) {
    console.error('Failed to instantiate OpenAI client:', e.message || e);
    return null;
  }
}

// Local LLaMA / local LLM support via HTTP API
function hasLlama() {
  return !!process.env.LLAMA_API_URL;
}

async function callLlama(prompt) {
  const url = process.env.LLAMA_API_URL;
  if (!url) throw new Error('LLAMA_API_URL not set');
  try {
    const resp = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ prompt }) });
    if (!resp.ok) throw new Error(`LLaMA host error: ${resp.status}`);
    const data = await resp.json();
    // Expect { text: '...' } or { output: '...' }
    return data.text || data.output || JSON.stringify(data);
  } catch (e) {
    throw e;
  }
}

// Gemini client (Google Generative AI) - similar pattern to estimateHybrid
let _geminiClient = null;
let discoveredGeminiModel = null;
const GEMINI_MODEL_CACHE = path.join(__dirname, '..', '.gemini_model');
// load cached model if present
try {
  if (fs.existsSync(GEMINI_MODEL_CACHE)) {
    const m = fs.readFileSync(GEMINI_MODEL_CACHE, 'utf8').trim();
    if (m) discoveredGeminiModel = m;
  }
} catch (e) {
  console.warn('Failed to read gemini model cache:', e?.message || e);
}
function ensureGemini() {
  const preferred = (process.env.PREFERRED_PROVIDER || '').toLowerCase();
  if (preferred === 'openai' || preferred === 'deepseek' || preferred === 'local') return null;
  if (!process.env.GEMINI_API_KEY) return null;
  if (_geminiClient) return _geminiClient;
  try {
    const { GoogleGenerativeAI } = require('@google/generative-ai');
    _geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini client initialized (chatController)');
    // start background discovery of supported models
    (async () => {
      try {
        if (typeof _geminiClient.listModels === 'function') {
          const list = await _geminiClient.listModels();
          let models = [];
          if (Array.isArray(list)) models = list;
          else if (Array.isArray(list?.models)) models = list.models;
          // pick a model that looks like it supports text generation
          for (const m of models) {
            const id = m?.name || m?.id || m?.model || m;
            if (!id) continue;
            const lid = id.toString().toLowerCase();
            // prefer gemini text models or text-bison
            if (lid.includes('gemini') || lid.includes('bison') || lid.includes('text')) {
              discoveredGeminiModel = id;
              console.log(`[Chat] Discovered Gemini model: ${discoveredGeminiModel}`);
              discoveredGeminiModel = id;
              try { fs.writeFileSync(GEMINI_MODEL_CACHE, String(discoveredGeminiModel), 'utf8'); } catch(e){console.warn('Failed to write gemini model cache:', e?.message || e)}
              console.log(`[Chat] Discovered Gemini model: ${discoveredGeminiModel}`);
              break;
            }
          }
        }
      } catch (e) {
        console.warn('[Chat] model discovery failed:', e?.message || e);
      }
    })();
    return _geminiClient;
  } catch (e) {
    console.error('[Chat] Failed to init Gemini client:', e.message || e);
    return null;
  }
}

// export ensureGemini for route discovery
exports.ensureGemini = ensureGemini;

// Try to call Gemini with a list of possible models when some models are unsupported
async function callGeminiWithFallback(client, prompt) {
  const tried = [];
  let candidates = [];
  // If we discovered a supported model earlier, try it first
  if (discoveredGeminiModel) candidates.push(discoveredGeminiModel);
  // If an explicit GEMINI_MODEL is configured, try it next
  if (process.env.GEMINI_MODEL) candidates.push(process.env.GEMINI_MODEL);
  // Try to discover models via ListModels API first
  try {
    if (client && typeof client.listModels === 'function') {
      const list = await client.listModels();
      // list may return { models: [...] } or an array
      let models = [];
      if (Array.isArray(list)) models = list;
      else if (Array.isArray(list?.models)) models = list.models;
      // extract model id/name
      for (const m of models) {
        const id = m?.name || m?.id || m?.model || m?.displayName || m;
        if (id && !candidates.includes(id)) candidates.push(id);
      }
    }
  } catch (e) {
    console.warn('[Chat] Could not call listModels:', e?.message || e);
  }
  // common fallback model names if discovery failed or listModels is not supported
  candidates = candidates.concat(['gemini-1.5-pro', 'gemini-1.5-flash-latest', 'gemini-pro', 'gemini-1.0-pro']);

  for (const m of candidates) {
    if (!m) continue;
    if (tried.includes(m)) continue;
    tried.push(m);
    try {
      console.log(`[Chat] Trying Gemini model: ${m}`);
      const model = client.getGenerativeModel({ model: m });
      // Some clients expect a string, some expect an object; keep call uniform
      const result = await model.generateContent(typeof prompt === 'string' ? prompt : prompt);
      return { result, model: m };
    } catch (e) {
      const msg = e?.message || e;
      console.error(`[Chat] Gemini model ${m} failed:`, msg);
      // If it's a not-found/unsupported model error, try next candidate
      if (String(msg).toLowerCase().includes('not found') || String(msg).toLowerCase().includes('404') || String(msg).toLowerCase().includes('not supported')) {
        continue;
      }
      // For other errors, still try next model but log
      continue;
    }
  }
  throw new Error('All Gemini model attempts failed');
}

// Optional Hugging Face fallback using HUGGINGFACE_API_KEY and global fetch (Node 18+)
function hasHuggingFace() {
  return !!process.env.HUGGINGFACE_API_KEY;
}

async function tryHuggingFace(prompt) {
  const model = process.env.HUGGINGFACE_MODEL || 'gpt2';
  const url = `https://api-inference.huggingface.co/models/${model}`;
  try {
    const resp = await fetch(url, {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ inputs: prompt, options: { wait_for_model: true } }),
    });
    if (!resp.ok) {
      const text = await resp.text();
      throw new Error(`HF error ${resp.status}: ${text}`);
    }
    const data = await resp.json();
    // HF inference may return an array or object; try to extract text
    if (Array.isArray(data) && data[0]?.generated_text) return data[0].generated_text;
    if (typeof data === 'string') return data;
    if (data.generated_text) return data.generated_text;
    if (Array.isArray(data) && data[0]?.text) return data[0].text;
    return JSON.stringify(data);
  } catch (e) {
    throw e;
  }
}

// Local naive QA: extract sentences from top docs that have most query words
function localAnswer(question, docs) {
  try {
    const qwords = question.toLowerCase().split(/\W+/).filter(Boolean);
    const candidates = [];
    for (const d of docs) {
      const text = (d.text || '').replace(/\s+/g, ' ');
      const sentences = text.match(/[^\.\!?]+[\.\!?]?/g) || [text];
      for (const s of sentences) {
        const low = s.toLowerCase();
        let cnt = 0;
        for (const w of qwords) if (low.includes(w)) cnt++;
        if (cnt > 0) candidates.push({ sentence: s.trim(), score: cnt });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    const top = candidates.slice(0, 4).map(c => c.sentence);
    if (top.length === 0) return null;
    return top.join(' \n');
  } catch (e) {
    return null;
  }
}

// --- Deepseek provider support ---
function hasDeepseek() {
  return !!process.env.DEEPSEEK_API_KEY;
}

// Lazy Deepseek client using OpenAI SDK with Deepseek base URL
let _deepseekClient = null;
function getDeepseekClient() {
  if (!process.env.DEEPSEEK_API_KEY) return null;
  if (_deepseekClient) return _deepseekClient;
  try {
    _deepseekClient = new OpenAI({
      apiKey: process.env.DEEPSEEK_API_KEY,
      baseURL: 'https://api.deepseek.com'
    });
    console.log('✅ Deepseek client initialized (using OpenAI SDK)');
    return _deepseekClient;
  } catch (e) {
    console.error('Failed to initialize Deepseek client:', e?.message || e);
    return null;
  }
}

async function callDeepseek(prompt) {
  const client = getDeepseekClient();
  if (!client) throw new Error('DEEPSEEK_API_KEY not set or client failed to initialize');
  
  const maxRetries = Math.max(0, parseInt(process.env.DEEPSEEK_RETRIES || '2', 10));
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      console.log(`[Chat] Deepseek attempt ${attempt + 1} using OpenAI SDK`);
      const completion = await client.chat.completions.create({
        model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
        messages: [
          { role: 'system', content: 'You are a helpful assistant for car damage assessment and cost estimation.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 512,
        temperature: 0.7,
        stream: false
      });
      
      const content = completion.choices?.[0]?.message?.content;
      if (content) {
        console.log(`[Chat] Deepseek success on attempt ${attempt + 1}`);
        return content;
      } else {
        throw new Error('No content in Deepseek response');
      }
    } catch (e) {
      const errorMsg = e?.message || String(e);
      console.error(`[Chat] Deepseek attempt ${attempt + 1} error:`, errorMsg);
      
      // Check for insufficient balance or quota issues
      if (errorMsg.toLowerCase().includes('insufficient balance') || 
          errorMsg.toLowerCase().includes('quota') || 
          errorMsg.toLowerCase().includes('402')) {
        console.warn('[Chat] Deepseek account has insufficient balance - skipping retries');
        throw new Error('Deepseek insufficient balance');
      }
      
      // Retry on other errors
      if (attempt < maxRetries) {
        const backoff = 500 * (attempt + 1);
        await new Promise(r => setTimeout(r, backoff));
        continue;
      }
      
      throw new Error(`Deepseek failed after ${attempt + 1} attempts: ${errorMsg}`);
    }
  }
}

// Simple in-memory vector store: { id, text, embedding }
let vectorStore = [];
let storeInitialized = false;
const EMBEDDING_CACHE = path.join(__dirname, '..', '.embeddings_cache.json');
let embeddingsComputing = false;

// Utility: cosine similarity
function cosine(a, b) {
  const dot = a.reduce((s, v, i) => s + v * (b[i] || 0), 0);
  const na = Math.sqrt(a.reduce((s, v) => s + v * v, 0));
  const nb = Math.sqrt(b.reduce((s, v) => s + v * v, 0));
  if (na === 0 || nb === 0) return 0;
  return dot / (na * nb);
}

async function initVectorStore() {
  if (storeInitialized) return;
  try {
    const projectRoot = path.join(__dirname, '..');
    const reportsDir = path.join(projectRoot, 'reports');
    const dbFile = path.join(projectRoot, 'database', 'sample_cost_data.json');

    const docs = [];

    // load files from reports/
    if (fs.existsSync(reportsDir)) {
      const files = fs.readdirSync(reportsDir);
      for (const f of files) {
        const p = path.join(reportsDir, f);
        if (fs.lstatSync(p).isFile()) {
          const text = fs.readFileSync(p, 'utf8');
          docs.push({ id: `report:${f}`, text, source: `reports/${f}` });
        }
      }
    }

    // load JSON database as one doc
    if (fs.existsSync(dbFile)) {
      const json = fs.readFileSync(dbFile, 'utf8');
      docs.push({ id: 'database:sample_cost_data', text: json, source: 'database/sample_cost_data.json' });
    }

    // create embeddings for docs (only if API key available)
    // check for embedding cache first
    let cache = null;
    try {
      if (fs.existsSync(EMBEDDING_CACHE)) {
        const raw = fs.readFileSync(EMBEDDING_CACHE, 'utf8');
        cache = JSON.parse(raw);
        if (Array.isArray(cache) && cache.length > 0) {
          vectorStore = cache;
          storeInitialized = true;
          console.log('✅ Loaded embeddings from cache with', vectorStore.length, 'documents');
        }
      }
    } catch (e) {
      console.warn('Failed to load embedding cache:', e?.message || e);
    }

    // If no cache, populate vectorStore with docs (embedding:null) and start background embedding creation
    if (!storeInitialized) {
      console.warn('OPENAI_API_KEY not set or no cache - building keyword-only index and scheduling background embeddings (if API key present).');
      for (const doc of docs) {
        vectorStore.push({ id: doc.id, text: doc.text, embedding: null, source: doc.source });
      }
      storeInitialized = true;

      // start background computation of embeddings if OpenAI key available and not already computing
      const client = getOpenAI();
      if (client && !embeddingsComputing) {
        embeddingsComputing = true;
        (async () => {
          console.log('🔁 Starting background embedding computation for RAG...');
          try {
            for (let i = 0; i < vectorStore.length; i++) {
              const item = vectorStore[i];
              if (!item.embedding) {
                try {
                  const embRes = await client.embeddings.create({ model: 'text-embedding-3-small', input: item.text.slice(0, 8192) });
                  const embedding = embRes.data[0].embedding;
                  item.embedding = embedding;
                  // write incremental cache so progress persists
                  try {
                    fs.writeFileSync(EMBEDDING_CACHE, JSON.stringify(vectorStore), 'utf8');
                  } catch (werr) {
                    console.warn('Failed to write embedding cache:', werr?.message || werr);
                  }
                  console.log(`🔹 Embedded doc ${item.id} (${i + 1}/${vectorStore.length})`);
                } catch (e) {
                  console.error('Background embedding error for', item.id, e?.message || e);
                }
              }
            }
            console.log('✅ Background embedding computation finished');
          } catch (e) {
            console.error('Background embedding process failed:', e?.message || e);
          } finally {
            embeddingsComputing = false;
          }
        })();
      }
      console.log('✅ RAG vector store initialized (text index) with', vectorStore.length, 'documents');
      return;
    }

    // if we loaded cache, ensure all docs from current repo are present and fill missing ones
    const existingIds = new Set(vectorStore.map(v => v.id));
    let changed = false;
    for (const doc of docs) {
      if (!existingIds.has(doc.id)) {
        vectorStore.push({ id: doc.id, text: doc.text, embedding: null, source: doc.source });
        changed = true;
      }
    }
    if (changed) {
      // kick off background embedding for missing items
      const client2 = getOpenAI();
      if (client2 && !embeddingsComputing) {
        embeddingsComputing = true;
        (async () => {
          console.log('🔁 Computing embeddings for newly added docs...');
          try {
            for (let i = 0; i < vectorStore.length; i++) {
              const item = vectorStore[i];
              if (!item.embedding) {
                try {
                  const embRes = await client2.embeddings.create({ model: 'text-embedding-3-small', input: item.text.slice(0, 8192) });
                  item.embedding = embRes.data[0].embedding;
                } catch (e) {
                  console.error('Embedding error for doc', item.id, e?.message || e);
                }
              }
            }
            try { fs.writeFileSync(EMBEDDING_CACHE, JSON.stringify(vectorStore), 'utf8'); } catch(e){console.warn('Failed to write embedding cache:', e?.message || e)}
            console.log('✅ Embeddings updated and cached');
          } catch (e) {
            console.error('Failed to compute embeddings for new docs:', e?.message || e);
          } finally { embeddingsComputing = false; }
        })();
      }
    }

    console.log('✅ RAG vector store ready with', vectorStore.length, 'documents (embeddings loaded from cache)');
  } catch (err) {
    console.error('Failed to initialize vector store:', err?.message || err);
  }
}

exports.chat = async (req, res) => {
  try {
    const { question, context } = req.body || {};
    if (!question) return res.status(400).json({ message: 'question is required' });

    // Use ONLY the enhanced Langchain + Gemini chatbot as requested
    if (!enhancedChatbot.isAvailable) {
      return res.status(500).json({ 
        message: 'Enhanced chatbot not available. Please ensure Python dependencies are installed.',
        error: 'CHATBOT_UNAVAILABLE'
      });
    }

    try {
      console.log('🤖 Using enhanced Langchain + Gemini chatbot (only model)...');
      
      let response;
      if (context) {
        // Process with damage report context
        console.log('📊 Processing with damage report context');
        const formattedContext = enhancedChatbot.formatAutoFixContext(context);
        response = await enhancedChatbot.processQuery(question, formattedContext);
        response.contextUsed = 'damage-report';
      } else {
        // Process as general automotive query
        console.log('🚗 Processing as general automotive query');
        response = await enhancedChatbot.processSimpleQuery(question);
        response.contextUsed = 'general-automotive';
      }
      
      if (response && response.answer) {
        console.log('✅ Enhanced chatbot response successful');
        return res.json({
          answer: response.answer,
          sources: response.sources || ['Enhanced AutoFix AI Analysis'],
          provider: response.model || 'gemini-2.0-flash-enhanced',
          enhanced: true,
          contextUsed: response.contextUsed
        });
      } else {
        throw new Error('No response generated from enhanced chatbot');
      }
      
    } catch (enhancedError) {
      console.error('❌ Enhanced chatbot failed:', enhancedError.message);
      return res.status(500).json({
        message: 'Enhanced chatbot encountered an error. Please try again.',
        error: enhancedError.message,
        provider: 'gemini-enhanced-error'
      });
    }
    
  } catch (error) {
    console.error('❌ Chat function error:', error);
    return res.status(500).json({
      message: 'Internal server error in chat function',
      error: error.message,
      provider: 'system-error'
    });
  }
};
      // if embeddings exist on docs and openai available, compute cosine similarity
      const hasEmbeddings = vectorStore.some(d => Array.isArray(d.embedding) && d.embedding.length > 0);
      if (hasEmbeddings && openai) {
        // create embeddings for question synchronously not here; we'll call API above
        return null; // signal to use embedding-path
      }

      // keyword fallback: simple word overlap scoring
      const qwords = question.toLowerCase().split(/\W+/).filter(Boolean);
      const scores = vectorStore.map(d => {
        const text = (d.text || '').toLowerCase();
        let cnt = 0;
        for (const w of qwords) if (text.includes(w)) cnt++;
        return { id: d.id, score: cnt, text: d.text, source: d.source };
      });
      scores.sort((a, b) => b.score - a.score);
      return scores.slice(0, k);
    }

    // If embeddings are available, use OpenAI embeddings for question
    const hasEmbeddings = vectorStore.some(d => Array.isArray(d.embedding) && d.embedding.length > 0);
    let top = [];

    if (hasEmbeddings && openai) {
      // embed question
      try {
        const qEmbRes = await openai.embeddings.create({ model: 'text-embedding-3-small', input: question });
        const qEmbedding = qEmbRes.data[0].embedding;
        const scores = vectorStore.map((d) => ({ id: d.id, score: cosine(qEmbedding, d.embedding || []), source: d.source, text: d.text }));
        scores.sort((a, b) => b.score - a.score);
        top = scores.slice(0, top_k);
      } catch (e) {
        // If OpenAI embedding fails (e.g., bad API key), fallback to keyword retrieval and try Gemini
        console.error('Embedding/ OpenAI error:', e?.message || e);
        top = retrieveTopDocs(question, top_k) || [];
      }
    } else {
      top = retrieveTopDocs(question, top_k) || [];
    }

    // build context from top
    const contextText = top.map((t, i) => `Source ${i + 1} (${t.source}):\n${(t.text||'').slice(0, 2000)}`).join('\n\n---\n\n');

    // If the caller provided structured context (from the Result page), prefer it
    const providedContext = req.body?.context;
    let structuredContextText = '';
    if (providedContext) {
      try {
        if (providedContext.carInfo) structuredContextText += `Vehicle: ${providedContext.carInfo.year} ${providedContext.carInfo.name} ${providedContext.carInfo.model}\n`;
        if (Array.isArray(providedContext.detectedParts)) structuredContextText += `Detected Parts: ${providedContext.detectedParts.join(', ')}\n`;
        if (Array.isArray(providedContext.costBreakdown)) structuredContextText += `Cost Breakdown: ${JSON.stringify(providedContext.costBreakdown)}\n`;
        if (providedContext.totalCost) structuredContextText += `Total Cost: ${providedContext.totalCost}\n`;
      } catch (e) {
        // ignore
      }
    }

    const systemPrompt = `You are an assistant that answers questions about car damage reports and cost-estimate data. Use the provided source context and the structured result context (if present) and answer concisely. If the answer is not contained in the sources or structured context, say you don't know but suggest next steps.`;
    const userPrompt = `Question: ${question}\n\nStructuredContext:\n${structuredContextText}\n\nRetrievedContext:\n${contextText}`;

    // If LLaMA is preferred or available without preference, use it first
    const preferred = (process.env.PREFERRED_PROVIDER || '').toLowerCase();
    const llamaAvailable = hasLlama();
    if (preferred === 'llama' || (llamaAvailable && preferred === '')) {
      try {
        const llRes = await callLlama(userPrompt);
        return res.json({ answer: llRes, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), provider: 'llama' });
      } catch (e) {
        console.error('[Chat] LLaMA error:', e?.message || e);
        // fallthrough to other providers
      }
    }

    // If Deepseek is preferred or available without explicit preference, try it next
    const deepseekAvailable = hasDeepseek();
    if (preferred === 'deepseek' || (deepseekAvailable && preferred === '')) {
      try {
        const ds = await callDeepseek(userPrompt);
        return res.json({ answer: ds, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), provider: 'deepseek' });
      } catch (e) {
        console.error('[Chat] Deepseek error:', e?.message || e);
        // fallthrough
      }
    }

    // prefer Gemini if available, else OpenAI chat
    if (gemini) {
      try {
        const { result, model: usedModel } = await callGeminiWithFallback(gemini, userPrompt);
        let text = '';
        if (result.response) text = result.response.text();
        else if (Array.isArray(result.candidates) && result.candidates[0]?.content?.parts) {
          text = result.candidates[0].content.parts.map(p => p.text || '').join('\n');
        } else if (Array.isArray(result) && result[0]?.text) {
          text = result.map(r => r.text).join('\n');
        }
        return res.json({ answer: text, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })) });
      } catch (e) {
        console.error('[Chat] Gemini error:', e?.message || e);
        // try Deepseek if available
        if (hasDeepseek()) {
          try {
            const ds = await callDeepseek(userPrompt);
            return res.json({ answer: ds, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), provider: 'deepseek' });
          } catch (dsErr) {
            console.error('[Chat] Deepseek fallback error:', dsErr?.message || dsErr);
          }
        }
        // try HuggingFace if available
        if (hasHuggingFace()) {
          try {
            const hf = await tryHuggingFace(userPrompt);
            return res.json({ answer: hf, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })) });
          } catch (hfErr) {
            console.error('[Chat] HuggingFace fallback error:', hfErr?.message || hfErr);
          }
        }
        // fallthrough to OpenAI or local QA
      }
    }

  if (openai) {
      try {
        const completion = await openai.chat.completions.create({
          model: process.env.OPENAI_MODEL || 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          max_tokens: 800,
        });
        const answer = completion.choices?.[0]?.message?.content || '';
        return res.json({ answer, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })) });
      } catch (e) {
        // If OpenAI returns auth error, try Gemini/HuggingFace/local as fallback
        console.error('Chat controller error:', e?.message || e);
        // try Deepseek as a fallback
        if (hasDeepseek()) {
          try {
            const ds = await callDeepseek(userPrompt);
            return res.json({ answer: ds, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), provider: 'deepseek' });
          } catch (dsErr) {
            console.error('[Chat] Deepseek fallback after OpenAI error failed:', dsErr?.message || dsErr);
          }
        }
        if (gemini) {
          try {
            const { result, model: usedModel } = await callGeminiWithFallback(gemini, userPrompt);
            let text = '';
            if (result.response) text = result.response.text();
            else if (Array.isArray(result.candidates) && result.candidates[0]?.content?.parts) {
              text = result.candidates[0].content.parts.map(p => p.text || '').join('\n');
            }
            return res.json({ answer: text, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })) });
          } catch (e2) {
            console.error('[Chat] Gemini fallback error:', e2?.message || e2);
            // try HuggingFace
            if (hasHuggingFace()) {
              try {
                const hf = await tryHuggingFace(userPrompt);
                return res.json({ answer: hf, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })) });
              } catch (hfErr) {
                console.error('[Chat] HuggingFace fallback error:', hfErr?.message || hfErr);
              }
            }
            // Final local QA fallback
            const local = localAnswer(question, top);
            if (local) return res.json({ answer: local, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), local: true });
            return res.status(500).json({ message: 'Failed to answer question with OpenAI/Gemini/HuggingFace' });
          }
        }
        // try huggingface if configured
        if (hasHuggingFace()) {
          try {
            const hf = await tryHuggingFace(userPrompt);
            return res.json({ answer: hf, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })) });
          } catch (hfErr) {
            console.error('[Chat] HuggingFace fallback error after OpenAI failure:', hfErr?.message || hfErr);
          }
        }
        const local = localAnswer(question, top);
        if (local) return res.json({ answer: local, sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), local: true });
        return res.status(500).json({ message: 'Failed to answer question' });
      }
    }

  // No cloud model configured — attempt a local, structured answer
  console.log('[Chat] All providers failed - using local fallback');
  
  // Try structured context first if available
  if (providedContext && (providedContext.detectedParts || providedContext.costBreakdown || providedContext.totalCost)) {
    let structuredAnswer = 'Based on the current analysis:\n\n';
    
    if (providedContext.carInfo) {
      structuredAnswer += `Vehicle: ${providedContext.carInfo.year} ${providedContext.carInfo.name} ${providedContext.carInfo.model}\n`;
    }
    
    if (Array.isArray(providedContext.detectedParts) && providedContext.detectedParts.length > 0) {
      structuredAnswer += `Detected damaged parts: ${providedContext.detectedParts.join(', ')}\n`;
    }
    
    if (Array.isArray(providedContext.costBreakdown) && providedContext.costBreakdown.length > 0) {
      structuredAnswer += '\nCost breakdown:\n';
      providedContext.costBreakdown.forEach(item => {
        structuredAnswer += `- ${item.part}: ₹${item.cost}\n`;
      });
    }
    
    if (providedContext.totalCost) {
      structuredAnswer += `\nTotal estimated cost: ₹${providedContext.totalCost}`;
    }
    
    structuredAnswer += '\n\nNote: This response is generated locally as external AI services are currently unavailable.';
    
    return res.json({ 
      answer: structuredAnswer, 
      sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), 
      local: true,
      provider: 'local-structured' 
    });
  }
  
  // Fallback to keyword-based answer
  const local = localAnswer(question, top.length > 0 ? top : vectorStore.slice(0, top_k));
  if (local) {
    return res.json({ 
      answer: local + '\n\nNote: This response is generated locally as external AI services are currently unavailable.', 
      sources: top.map(t => ({ id: t.id, source: t.source, score: t.score })), 
      local: true,
      provider: 'local-keywords'
    });
  }
  
  // Final fallback - basic response
  return res.json({
    answer: 'I apologize, but I cannot provide a detailed answer at the moment as external AI services are unavailable and no relevant information was found in the knowledge base. Please ensure your API keys are valid and have sufficient balance, or try again later.',
    sources: [],
    local: true,
    provider: 'local-fallback'
  });
  
  } catch (err) {
    console.error('Chat controller error:', err?.message || err);
    res.status(500).json({ message: 'Failed to answer question' });
  }
};
