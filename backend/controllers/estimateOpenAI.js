// backend/controllers/estimateOpenAI.js
const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.estimateCost = async (req, res) => {
  try {
    const { carName, carModel, carYear, detectedParts } = req.body;

    if (!carName || !carModel || !carYear || !Array.isArray(detectedParts)) {
      return res.status(400).json({ message: "Missing car info or detected parts." });
    }

    const prompt = `Estimate repair costs for damaged car parts: ${detectedParts.join(", ")} on a ${carName} ${carModel} (${carYear}). 
Return output as JSON in the following format:
{
  "bumper": 3000,
  "hood": 3500,
  "total": 6500
}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4", // or "gpt-3.5-turbo" if you prefer
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content;

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}") + 1;
    const jsonText = text.slice(jsonStart, jsonEnd);
    const parsed = JSON.parse(jsonText);

    const { total, ...costBreakdown } = parsed;

    res.json({ costBreakdown, totalCost: total });
  } catch (error) {
    console.error("OpenAI ChatGPT error:", error.message);
    res.status(500).json({ message: "Failed to estimate cost using ChatGPT" });
  }
};
