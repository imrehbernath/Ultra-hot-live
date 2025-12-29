
import { GoogleGenAI, Type } from "@google/genai";
import { TrendTopic, GeminiResponse } from "../types";

export const fetchTrendingTopics = async (): Promise<GeminiResponse> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `ULTRA-FAST GLOBAL TREND RADAR. 
    CURRENT TIME: ${new Date().toISOString()}
    
    INSPIRATION KEYWORDS (Use these as a guide for high-velocity topics):
    TRUMP, ELON, MUSK, AI, GPT, AGENT, PEPE, DOGE, BONK, WIF, LUIGI MANGIONE, CEO, HEALTHCARE, GTA6, ROCKSTAR, NINTENDO, MARIO, ZELDA, SONIC, MINECRAFT, CHRISTMAS, SANTA, NEWYEAR, 2026, HAWK TUAH, SKIBIDI, SIGMA, RIZZ, CHAD, GIGA, MEME, PUMP, VITALIK, ALTMAN, OPENAI, CLAUDE.

    TASK: 
    1. Identify the TOP 15 most viral topics WORLDWIDE. 
    2. Focus heavily on TECH, CRYPTO (Pepe, Doge, etc.), ENTERTAINMENT, and GLOBAL NEWS.
    
    LANGUAGE RULES:
    - 'topic': MUST be in ENGLISH (e.g., "Elon Musk", "Bitcoin Pump", "GTA 6 Trailer").
    - 'category': MUST be in ENGLISH (e.g., "CRYPTO", "BREAKING", "TECH").
    - 'description': MUST be in DUTCH (Nederlands).
    - 'globalSummary': MUST be in DUTCH (Nederlands).
    
    OUTPUT FORMAT:
    {
      "globalSummary": "Een krachtige Nederlandstalige samenvatting van de wereldwijde trends.",
      "trends": [
        {
          "topic": "English Topic Name",
          "category": "ENGLISH_CAT",
          "description": "Nederlandse uitleg van de trend",
          "location": "Country/Global",
          "volumeScore": 1-100,
          "sentiment": "viral/positive/neutral/negative"
        }
      ]
    }
    
    INSTRUCTIONS:
    - Use Google Search for real-time data from the last 30 minutes.
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
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Source",
        uri: chunk.web.uri
      }));

    return { 
      trends, 
      globalSummary: data.globalSummary || "Systeem synchroniseert globale data...",
      sources 
    };
  } catch (error: any) {
    console.error("Gemini Error:", error);
    throw error;
  }
};
