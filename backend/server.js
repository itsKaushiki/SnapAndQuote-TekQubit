// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

// Explicitly load backend .env regardless of process.cwd()
require('dotenv').config({ path: path.join(__dirname, '.env') });

// ─────────────────────────────────────────────────────
// Initialize App
const app = express();
const PORT = process.env.PORT || 5000;

// ─────────────────────────────────────────────────────
// Middleware
app.use((req, res, next) => {
  req.setTimeout(120000); // 2 mins
  next();
});

// CORS
app.use(
  cors({
    origin: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    credentials: true,
  })
);

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─────────────────────────────────────────────────────
// Serve Uploaded Files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// ─────────────────────────────────────────────────────
// Routes
const uploadRoutes = require('./routes/upload');
const estimateRoutes = require('./routes/estimate');
const detectRoutes = require('./routes/detect');
const chatRoutes = require('./routes/chat');
const chatModelsRoutes = require('./routes/chatModels');
const reportsRoutes = require('./routes/reports');
const historyRoutes = require('./routes/history');
const interiorRoutes = require('./routes/interior');
const audioRoutes = require('./routes/audio');

app.use('/api/estimate', estimateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/detect', detectRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/chat/models', chatModelsRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/interior', interiorRoutes);
app.use('/api/audio', audioRoutes);

console.log('✅ All routes registered including /api/history');

// ─────────────────────────────────────────────────────
// MongoDB Connection (if used)
if (process.env.MONGO_URI) {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
    process.exit(1);
  });
}

// ─────────────────────────────────────────────────────
// Start Server
app.listen(PORT, () => {
  console.log(`🚀 AutoFix AI backend running at http://localhost:${PORT}`);
  const hasOpenAI = !!process.env.OPENAI_API_KEY;
  const hasGemini = !!process.env.GEMINI_API_KEY;
  console.log(`🔑 OpenAI configured: ${hasOpenAI ? 'YES' : 'NO'}`);
  if (hasOpenAI) console.log(`   OPENAI_MODEL=${process.env.OPENAI_MODEL || '(default)'}`);
  console.log(`🔑 Gemini configured: ${hasGemini ? 'YES' : 'NO'}`);
  if (hasGemini) console.log(`   GEMINI_MODEL=${process.env.GEMINI_MODEL || '(default)'}`);
  const hasDeepseek = !!process.env.DEEPSEEK_API_KEY;
  console.log(`🔑 Deepseek configured: ${hasDeepseek ? 'YES' : 'NO'}`);
  if (hasDeepseek) console.log(`   DEEPSEEK_MODEL=${process.env.DEEPSEEK_MODEL || 'deepseek-chat'}`);
  console.log(`⚙️ Preferred provider: ${process.env.PREFERRED_PROVIDER || '(auto)'}`);
  console.log(`🧠 LLaMA configured: ${process.env.LLAMA_API_URL ? 'YES' : 'NO'}`);
});

