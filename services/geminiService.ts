
import { GoogleGenAI, Type } from "@google/genai";
import { TrendTopic } from "../types";

export const fetchTrendingTopics = async (): Promise<TrendTopic[]> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });
  
  const prompt = `ACT AS A REAL-TIME USA VIRAL DETECTION SYSTEM. 
    CURRENT TIMESTAMP: ${new Date().toISOString()}
    
    MISSION: Identify the top 30-40 most explosive trending topics in the United States occurring RIGHT NOW.
    
    CRITICAL INSTRUCTIONS:
    1. DO NOT rely on past knowledge or static lists. Use Google Search to find what is spiking in the last 15-30 minutes.
    2. Look for "micro-trends": even single words or numbers (like "six", "seven", or cryptic viral phrases) that are currently flooding search or social feeds.
    3. DISREGARD previous example keywords (like BARBIE, GTA, etc.) UNLESS they are genuinely at a viral peak this exact hour.
    4. Categories to monitor: Breaking News (US focus), Tech/Gaming leaks, Entertainment scandals/releases, Viral Memes, and high-velocity Finance/Stock moves.
    
    For each topic, provide:
    - Topic: The exact trending phrase or entity.
    - Category: (Entertainment, Tech & Gaming, News & Politics, Viral & Memes, Finance, Sports).
    - Description: Exactly what is happening to cause this spike (Max 12 words).
    - VolumeScore: 1-100 (Intensity of the spike).
    - Sentiment: (positive, negative, neutral, viral).
    
    MANDATORY: Use Google Search Grounding. Your data must be 100% current for the US market.
    Output only a valid JSON array.`;

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
    console.error("Discovery System Error:", error);
    return [];
  }
};
