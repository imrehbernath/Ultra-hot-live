
import { GoogleGenAI, Type } from "@google/genai";
import { TrendTopic, TrendCategory } from "../types";

export const fetchTrendingTopics = async (): Promise<TrendTopic[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  const prompt = `ACT AS A HIGH-FREQUENCY USA TREND & CRYPTO TICKER DISCOVERY ENGINE. 
    CURRENT ISO TIMESTAMP: ${new Date().toISOString()}
    
    MISSION: Identify the top 40-50 most explosive entities peaking in the United States RIGHT NOW.
    
    CRITICAL INSTRUCTIONS:
    1. DUAL-STREAM SCAN: 
       - Stream A: General Viral Trends (News, Gaming, Entertainment, Memes, micro-words like 'six' or 'seven').
       - Stream B: High-Velocity Crypto Tokens (Specific memecoins, tickers like $PEPE, $SOL, $DOGE, or new trending tokens spiking on DexTools/X/CoinMarketCap).
    2. EXCLUSIVELY use Google Search Grounding to find data from the LAST 5-20 MINUTES.
    3. PRIORITY: If a token just "mooned" or a ticker is being spammed in the last 10 minutes, put it in the list.
    4. DATA FORMATTING: For crypto topics, use the ticker if possible (e.g., "PEPE", "SOL", "WIF") or the full name if it's a major move.
    5. IGNORE OLD DATA: Only focus on the absolute current heat.
    
    For each trend, provide:
    - topic: The Ticker or Name (e.g., "TRUMP", "$PEPE", "GTA6").
    - category: Use one of: Entertainment, Tech & Gaming, News & Politics, Viral & Memes, Finance, Sports, Crypto & Web3.
    - description: One-sentence explanation of the EXACT current spike (Max 12 words).
    - volumeScore: 1-100 (Relative viral intensity/velocity).
    - sentiment: (positive, negative, neutral, viral).
    
    OUTPUT: A valid JSON array of objects.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              topic: { type: Type.STRING },
              category: { type: Type.STRING },
              description: { type: Type.STRING },
              volumeScore: { type: Type.NUMBER },
              sentiment: { type: Type.STRING },
            },
            required: ["topic", "category", "description", "volumeScore", "sentiment"]
          }
        }
      },
    });

    const result = JSON.parse(response.text || "[]");
    
    return result.map((item: any, index: number) => ({
      ...item,
      id: `${Date.now()}-${index}`,
      timestamp: new Date().toISOString()
    }));
  } catch (error) {
    console.error("Signal Acquisition Error:", error);
    return [];
  }
};
