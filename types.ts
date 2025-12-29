
export interface TrendTopic {
  id: string;
  topic: string;
  category: string;
  description: string;
  volumeScore: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'viral';
  location: string;
  timestamp: string;
}

export interface GeminiResponse {
  trends: TrendTopic[];
  globalSummary: string;
  sources: { title: string; uri: string }[];
}
