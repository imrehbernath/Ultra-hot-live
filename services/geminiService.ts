
import { GoogleGenAI } from "@google/genai";
import { TrendTopic, GeminiResponse } from "../types";

// Service to fetch trending topics transformed into Meme Coin tickers
export const fetchTrendingTopics = async (): Promise<GeminiResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  const prompt = `REAL-TIME US MEME COIN TICKER GENERATOR. 
    TIMESTAMP: ${new Date().toISOString()}
    
    TASK: Scan current USA viral news, social media peaks, and trending events. 
    TRANSFORM these events into highly tradeable "Meme Coin" names and tickers.
    
    INSTRUCTIONS:
    1. Identify what is trending in the US RIGHT NOW (last 30-60 mins).
    2. Convert each trend into a "Ticker" (e.g., $ELON, $HAWK, $PEPE vibe).
    3. Be creative: if a specific person or event is viral, create a catchy ticker for it.
    4. Use Google Search grounding to ensure these are actually trending topics.
    
    JSON SCHEMA FOR EACH OBJECT:
    - topic: The Ticker name (e.g., $TICKER) - MUST START WITH $.
    - category: Choose from: [Breaking Catalyst, Viral Meme, Political Hype, Tech Alpha, Sports Pump, Entertainment].
    - description: Why this ticker is trending. Max 10 words. (e.g., "Trending due to X's latest post about Mars").
    - volumeScore: 1-100 (representing social media "heat").
    - sentiment: positive, negative, neutral, viral.
    
    IMPORTANT: Provide ONLY the JSON array. Do not include markdown blocks. Return 20-30 tickers.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });

    let text = response.text || "[]";
    
    // Strip markdown code blocks if the model included them
    if (text.includes("```json")) {
      text = text.split("```json")[1].split("```")[0];
    } else if (text.includes("```")) {
      text = text.split("```")[1].split("```")[0];
    }

    let parsedTrends: any[] = [];
    try {
      parsedTrends = JSON.parse(text.trim());
    } catch (e) {
      const start = text.indexOf('[');
      const end = text.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        parsedTrends = JSON.parse(text.substring(start, end + 1));
      }
    }
    
    const trends: TrendTopic[] = parsedTrends.map((item: any, index: number) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      topic: item.topic?.startsWith('$') ? item.topic.toUpperCase() : `$${item.topic?.toUpperCase()}`,
      timestamp: new Date().toISOString()
    }));

    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Context Link",
        uri: chunk.web.uri
      }));

    return { trends, sources };
  } catch (error) {
    throw error;
  }
};
