const { OpenAI } = require("openai");
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

exports.estimateCost = async (req, res) => {
  try {
    const { carName, carModel, carYear, detectedParts } = req.body;

    const prompt = `The following car parts are damaged: ${detectedParts.join(', ')} on a ${carName} ${carModel} (${carYear}). Estimate repair cost per part and total in JSON format.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt }],
    });

    const text = completion.choices[0].message.content;
    const json = JSON.parse(text.substring(text.indexOf("{")));

    const { total, ...costBreakdown } = json;

    res.json({ costBreakdown, totalCost: total });
  } catch (err) {
    console.error('OpenAI error:', err.message);
    res.status(500).json({ message: 'Failed to estimate cost' });
  }
};
