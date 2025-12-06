// backend/controllers/detectOpenAI.js
const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');
require('dotenv').config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.detectDamageOpenAI = async (req, res) => {
  try {
    const { name, model, year } = req.body;
    const imagePath = req.file.path;

    const base64Image = fs.readFileSync(imagePath, { encoding: 'base64' });

    const prompt = `You are an expert automotive engineer. Analyze the image and identify visible damaged car parts. Return only a JSON array of part names.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // ✅ Updated model
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${base64Image}`,
              },
            },
          ],
        },
      ],
      max_tokens: 300,
    });

    const reply = response.choices[0]?.message?.content || "";

    // Extract detected parts (simple fallback, for dev use)
    const parts = JSON.parse(reply);

    res.json({ parts });
  } catch (error) {
    console.error("OpenAI Vision error:", error.message);
    res.status(500).json({ message: "Damage detection failed using OpenAI Vision" });
  }
};
