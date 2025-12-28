
export interface TrendTopic {
  id: string;
  topic: string;
  category: TrendCategory;
  description: string;
  volumeScore: number;
  sentiment: 'positive' | 'negative' | 'neutral' | 'viral';
  sourceUrl?: string;
  timestamp: string;
}

export enum TrendCategory {
  ENTERTAINMENT = 'Entertainment',
  TECH = 'Tech & Gaming',
  NEWS = 'News & Politics',
  MEMES = 'Viral & Memes',
  FINANCE = 'Finance',
  SPORTS = 'Sports',
  CRYPTO = 'Crypto & Web3'
}

export interface GeminiResponse {
  trends: TrendTopic[];
  sources: { title: string; uri: string }[];
}
