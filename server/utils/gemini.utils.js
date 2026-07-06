
const { GoogleGenerativeAI } = require("@google/generative-ai");

let genAI = null;

function getGenAI() {
  if (!genAI) {
    genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  }
  return genAI;
}

const MODEL_NAME = process.env.GEMINI_MODEL || "gemini-2.5-flash";

async function generateVideoInsights({ title, description, category, tags = [] }) {
  const model = getGenAI().getGenerativeModel({ model: MODEL_NAME });

  const prompt = `
You are a content metadata assistant for YouCube, a video streaming platform.
Analyze the following video metadata and generate:
1. A concise, engaging 2-3 sentence AI summary (written in third person, describing what the video is about).
2. An array of 5-8 lowercase SEO-optimized tags (single words or short hyphenated phrases, no duplicates, no symbols).

Video Metadata:
- Title: "${title}"
- Description: "${description.substring(0, 800)}"
- Category: "${category}"
- Existing tags: [${tags.map(t => `"${t}"`).join(", ")}]

Respond ONLY with valid JSON in this exact format (no markdown, no explanation):
{
  "aiSummary": "...",
  "aiTags": ["tag1", "tag2", "tag3", "tag4", "tag5"]
}
`;

  const result = await model.generateContent(prompt);
  const text = result.response.text().trim();

  // Strip any accidental markdown code fences
  const cleaned = text.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();

  const parsed = JSON.parse(cleaned);

  if (!parsed.aiSummary || !Array.isArray(parsed.aiTags)) {
    throw new Error("Gemini returned unexpected response structure");
  }

  return {
    aiSummary: parsed.aiSummary,
    aiTags: parsed.aiTags.map(t => String(t).toLowerCase().trim()).slice(0, 8),
  };
}

module.exports = { generateVideoInsights };
