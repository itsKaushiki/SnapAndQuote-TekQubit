// backend/controllers/estimateHybrid.js
// Provides cost estimation with OpenAI primary and Gemini fallback plus local baseline-normalized heuristic.

const path = require('path');
const fs = require('fs');
const { calculateCost } = require('./costController');

const PROVIDERS = {
  OPENAI: 'openai',
  GEMINI: 'gemini'
};

// Load baseline cost dataset once (lazy)
let baseline = null;
function loadBaseline() {
  if (baseline) return baseline;
  try {
    const p = path.join(__dirname, '..', 'data', 'part_cost_baseline.inr.json');
    const raw = fs.readFileSync(p, 'utf-8');
    baseline = JSON.parse(raw);
  } catch (e) {
    console.error('[Estimate] Failed to load baseline dataset:', e.message);
    baseline = { currency: 'INR', parts: {}, defaults: { min: 2000, aftermarket: 4000, avg: 6000, oem: 10000, max: 15000 }, version: 'missing' };
  }
  return baseline;
}

// Lazy-loaded clients
let openaiClient = null;
let geminiClient = null;

function ensureOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    try {
      const { OpenAI } = require('openai');
      openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    } catch (e) {
      console.error('[Estimate] Failed to init OpenAI client:', e.message);
      return null;
    }
  }
  return openaiClient;
}

function ensureGemini() {
  if (!process.env.GEMINI_API_KEY) return null;
  if (!geminiClient) {
    try {
      const { GoogleGenerativeAI } = require('@google/generative-ai');
      geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    } catch (e) {
      console.error('[Estimate] Failed to init Gemini client:', e.message);
      return null;
    }
  }
  return geminiClient;
}

function buildPrompt({ carName, carModel, carYear, detectedParts }) {
  return `Estimate repair costs for damaged car parts: ${detectedParts.join(', ')} on a ${carName} ${carModel} (${carYear}). Return ONLY valid minified JSON with numeric values and a total field.
Example: {"bumper": 3000, "door": 2500, "total": 5500}`;
}

function extractJson(text) {
  if (!text) throw new Error('Empty model response');
  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) {
    throw new Error('No JSON object delimiters found');
  }
  const candidate = text.slice(first, last + 1).trim();
  return JSON.parse(candidate);
}

async function tryOpenAI(prompt) {
  const client = ensureOpenAI();
  if (!client) return { ok: false, provider: PROVIDERS.OPENAI, error: 'OPENAI_API_KEY missing or client init failed' };
  try {
    const completion = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 300
    });
    const content = completion.choices?.[0]?.message?.content;
    const json = extractJson(content);
    return { ok: true, provider: PROVIDERS.OPENAI, json, raw: content };
  } catch (e) {
    return { ok: false, provider: PROVIDERS.OPENAI, error: e.message };
  }
}

async function tryGemini(prompt) {
  const client = ensureGemini();
  if (!client) return { ok: false, provider: PROVIDERS.GEMINI, error: 'GEMINI_API_KEY missing or client init failed' };
  try {
    const model = client.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-1.5-flash' });
    const result = await model.generateContent(prompt);
    let text = '';
    if (result.response) {
      text = result.response.text();
    } else if (Array.isArray(result.candidates) && result.candidates[0]?.content?.parts) {
      text = result.candidates[0].content.parts.map(p => p.text || '').join('\n');
    }
    const json = extractJson(text);
    return { ok: true, provider: PROVIDERS.GEMINI, json, raw: text };
  } catch (e) {
    return { ok: false, provider: PROVIDERS.GEMINI, error: e.message };
  }
}

exports.estimateCost = async (req, res) => {
  try {
    const { carName, carModel, carYear, detectedParts } = req.body;
    if (!carName || !carModel || !carYear || !Array.isArray(detectedParts) || detectedParts.length === 0) {
      return res.status(400).json({ message: 'Missing car info or detected parts.' });
    }

    const prompt = buildPrompt({ carName, carModel, carYear, detectedParts });
    const attempts = [];

    // Primary: OpenAI
    const openaiAttempt = await tryOpenAI(prompt);
    attempts.push({ provider: openaiAttempt.provider, ok: openaiAttempt.ok, error: openaiAttempt.error });
    let result = openaiAttempt;

    // Fallback to Gemini if OpenAI failed
    if (!openaiAttempt.ok) {
      const geminiAttempt = await tryGemini(prompt);
      attempts.push({ provider: geminiAttempt.provider, ok: geminiAttempt.ok, error: geminiAttempt.error });
      result = geminiAttempt;
    }

    if (!result.ok) {
      // Local deterministic heuristic fallback using baseline avg values
      const base = loadBaseline();
      const uniqueParts = [...new Set(detectedParts.map(p => p.toLowerCase()))];
      const breakdown = uniqueParts.map(p => {
        const rec = base.parts[p] || base.defaults;
        return { part: p, cost: rec.avg, thirdParty: rec.aftermarket ?? rec.avg, oem: rec.oem ?? rec.avg };
      });
      const totalHeuristic = breakdown.reduce((s, b) => s + (b.cost || 0), 0);
      const totalThirdParty = breakdown.reduce((s, b) => s + (b.thirdParty || 0), 0);
      const totalOEM = breakdown.reduce((s, b) => s + (b.oem || 0), 0);
      attempts.push({ provider: 'local', ok: true, heuristic: true, baselineVersion: base.version });
      return res.json({
        provider: 'local',
        currency: base.currency || 'INR',
        attempts,
        baselineVersion: base.version,
        costBreakdown: breakdown,
        totalCost: totalHeuristic,
        dualBreakdown: {
          parts: breakdown.map(({ part, thirdParty, oem }) => ({ part, thirdParty, oem })),
          totalThirdParty,
          totalOEM
        },
        normalization: []
      });
    }

    const { json } = result;
    // Derive total if missing later (after normalization) so keep raw first
    const base = loadBaseline();
    const normalization = [];

    // Build breakdown excluding 'total' key initially
    const entries = Object.entries(json).filter(([k]) => k !== 'total');
    const costBreakdown = entries.map(([part, rawCost]) => {
      let cost = typeof rawCost === 'number' ? rawCost : 0;
      const rec = base.parts[part.toLowerCase?.()] || base.parts[part] || base.defaults;
      if (rec) {
        const { min, max } = rec;
        if (typeof min === 'number' && cost < min) {
          normalization.push({ part, original: cost, adjusted: min, min, max });
          cost = min;
        } else if (typeof max === 'number' && cost > max) {
          normalization.push({ part, original: cost, adjusted: max, min, max });
          cost = max;
        }
        // If zero or negative, replace with avg (fallback)
        if (cost <= 0 && typeof rec.avg === 'number') {
          normalization.push({ part, original: rawCost, adjusted: rec.avg, min, max });
          cost = rec.avg;
        }
      }
      
      // Dual pricing using baseline ranges
      const thirdParty = rec?.aftermarket ?? cost; // prefer baseline aftermarket
      const oem = rec?.oem ?? Math.max(cost, rec?.avg ?? cost);
      return { part, cost, thirdParty, oem };
    });

    // Add any detected parts missing from AI output using baseline averages
    // detectedParts already destructured at start of handler
    if (Array.isArray(detectedParts)) {
      const existing = new Set(costBreakdown.map(c => c.part.toLowerCase()));
      detectedParts.forEach(p => {
        const key = p.toLowerCase();
        if (!existing.has(key)) {
          const rec = base.parts[key] || base.defaults;
          costBreakdown.push({ part: key, cost: rec.avg, thirdParty: rec.aftermarket ?? rec.avg, oem: rec.oem ?? rec.avg });
          normalization.push({ part: key, original: null, adjusted: rec.avg, min: rec.min, max: rec.max, added: true });
        }
      });
    }

    // Recompute totals (legacy totalCost remains sum of normalized 'cost')
    const total = costBreakdown.reduce((s, c) => s + (typeof c.cost === 'number' ? c.cost : 0), 0);
    const totalThirdParty = costBreakdown.reduce((s, c) => s + (typeof c.thirdParty === 'number' ? c.thirdParty : 0), 0);
    const totalOEM = costBreakdown.reduce((s, c) => s + (typeof c.oem === 'number' ? c.oem : 0), 0);

    return res.json({
      provider: result.provider,
      currency: base.currency || 'INR',
      attempts,
      baselineVersion: base.version,
      costBreakdown,
      totalCost: total,
      dualBreakdown: {
        parts: costBreakdown.map(({ part, thirdParty, oem }) => ({ part, thirdParty, oem })),
        totalThirdParty,
        totalOEM
      },
      normalization
    });
  } catch (err) {
    console.error('[Estimate Hybrid] Unexpected error:', err);
    return res.status(500).json({ message: 'Unexpected estimation error' });
  }
};