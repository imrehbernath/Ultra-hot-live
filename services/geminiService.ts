
import { GoogleGenAI } from "@google/genai";
import { TrendTopic, GeminiResponse, ScreenshotAnalysis } from "../types";

const VISION_SYSTEM_INSTRUCTION = `Je bent een crypto memecoin analyst met vision. Je analyseert screenshots van pump.fun, DEX Screener, of andere crypto platforms.

TAAK:
1. Extraheer ALLE token namen/symbols uit de screenshot
2. Score elke naam op ORIGINALITEIT (1-10)
3. Sorteer op score (hoogste eerst)
4. Geef trending keywords die je ziet

SCORE SCHAAL (1-10):
9-10 VIRAL - Uniek, memorabel, wekt curiositeit (Remilia, Loopie, Moodeng)
7-8 STERK - Specifieke referentie, onderscheidend (Gandalf, Harambe)
5-6 GEMIDDELD - Werkt maar niet bijzonder (Shark, Thunder)
3-4 ZWAK - Oversaturated (pepe variant, doge variant, phantom)
1-2 TROEP - Low effort, random (POOP, cat, MM, Q1)

RESPONSE FORMAT (alleen JSON):
{
  "tokens_found": number,
  "scored_tokens": [
    {"rank": number, "name": "string", "score": number, "reason": "string"}
  ],
  "top_picks": ["string"],
  "avoid": ["string"],
  "trending_themes": ["string"],
  "market_sentiment": "string"
}

BELANGRIJKE REGELS:
- Extract ALLE zichtbare token namen/symbols
- Negeer prijzen, percentages, marktdata - focus op NAMEN
- Score ALLEEN op naam originaliteit, niet op performance
- Wees streng: 90% van namen zijn 1-5, slechts 10% is 6+
- Top picks = alleen score 8+
- Avoid = alles score 3 of lager`;

export const analyzeScreenshot = async (base64Image: string, mimeType: string): Promise<ScreenshotAnalysis> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        {
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        },
        {
          text: "Analyseer deze screenshot. Extract alle token namen en score ze op originaliteit. Return ONLY the JSON object.",
        },
      ],
      config: {
        systemInstruction: VISION_SYSTEM_INSTRUCTION,
        responseMimeType: "application/json",
      },
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Vision Analysis Error:", error);
    throw error;
  }
};

export const fetchTrendingTopics = async (): Promise<GeminiResponse> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) throw new Error("API_KEY_MISSING");

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `ULTRA-FAST TREND RADAR. 
    CURRENT TIME: ${new Date().toISOString()}
    
    TARGET KEYWORDS (Prioritize these or similar high-velocity terms):
    TRUMP, ELON, MUSK, AI, GPT, AGENT, PEPE, DOGE, BONK, WIF, LUIGI MANGIONE, CEO, HEALTHCARE, GTA6, ROCKSTAR, NINTENDO, MARIO, ZELDA, SONIC, MINECRAFT, CHRISTMAS, SANTA, NEWYEAR, 2026, HAWK TUAH, SKIBIDI, SIGMA, RIZZ, CHAD, GIGA, MEME, PUMP, VITALIK, ALTMAN, OPENAI, CLAUDE.

    STRICT RULES:
    - 'topic': MUST be a SINGLE WORD or MAX 2-WORD KEYWORD in ENGLISH.
    - 'category': MUST be in ENGLISH.
    - 'description': MUST be a brief summary in DUTCH (Nederlands).
    - 'globalSummary': MUST be a short (max 2 sentences) overview in DUTCH (Nederlands).
    
    OUTPUT FORMAT (JSON ONLY):
    {
      "globalSummary": "...",
      "trends": [
        { "topic": "...", "category": "...", "description": "...", "location": "Global", "volumeScore": 1-100, "sentiment": "viral" }
      ]
    }
    
    INSTRUCTIONS:
    - Use Google Search for data from the LAST 30 MINUTES.
    - Return ONLY pure JSON.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
      },
    });

    const data = JSON.parse(response.text || "{}");
    const trends: TrendTopic[] = (data.trends || []).map((item: any, index: number) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      timestamp: new Date().toISOString()
    }));

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks.filter((chunk: any) => chunk.web).map((chunk: any) => ({
      title: chunk.web.title || "Source",
      uri: chunk.web.uri
    }));

    return { trends, globalSummary: data.globalSummary || "Synchroniseren...", sources };
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
