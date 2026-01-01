
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

export interface ScoredToken {
  rank: number;
  name: string;
  score: number;
  reason: string;
}

export interface ScreenshotAnalysis {
  tokens_found: number;
  scored_tokens: ScoredToken[];
  top_picks: string[];
  avoid: string[];
  trending_themes: string[];
  market_sentiment: string;
}
