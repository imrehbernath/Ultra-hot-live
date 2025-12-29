
import { GoogleGenAI, Type } from "@google/genai";
import { TrendTopic, GeminiResponse } from "../types";

export const fetchTrendingTopics = async (): Promise<GeminiResponse> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error("API_KEY_MISSING");
  }

  const ai = new GoogleGenAI({ apiKey });
  
  const prompt = `ULTRA-FAST GLOBAL TREND RADAR. 
    HUIDIGE TIJD: ${new Date().toISOString()}
    
    TAAK: 
    1. Identificeer de TOP 15 meest virale onderwerpen WERELDWIJD (niet alleen USA, focus ook op Europa, Azië en Midden-Oosten).
    2. Schrijf een 'globalSummary' van max 2 zinnen die de huidige algehele wereldwijde sfeer samenvat.
    
    BELANGRIJK: Schrijf de 'description' en de 'globalSummary' ALTIJD in het NEDERLANDS.
    
    OUTPUT FORMAT:
    {
      "globalSummary": "Nederlandstalige samenvatting van de wereldwijde toestand.",
      "trends": [
        {
          "topic": "Naam",
          "category": "HOT/BREAKING/etc",
          "description": "Nederlandse uitleg",
          "location": "Land of Regio",
          "volumeScore": 1-100,
          "sentiment": "viral/positive/neutral/negative"
        }
      ]
    }
    
    INSTRUCTIES:
    - Gebruik Google Search voor de meest actuele data van de afgelopen 30 minuten.
    - Retourneer alleen pure JSON.`;

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
        title: chunk.web.title || "Bron",
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
