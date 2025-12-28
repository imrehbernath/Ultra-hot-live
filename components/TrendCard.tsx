
import React from 'react';
import { TrendTopic, TrendCategory } from '../types';

interface TrendCardProps {
  trend: TrendTopic;
}

const getCategoryColor = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('entertainment')) return 'from-purple-600/20 to-indigo-600/20 text-purple-400 border-purple-500/20';
  if (normalized.includes('tech') || normalized.includes('gaming')) return 'from-blue-600/20 to-cyan-600/20 text-blue-400 border-blue-500/20';
  if (normalized.includes('news')) return 'from-red-600/20 to-orange-600/20 text-red-400 border-red-500/20';
  if (normalized.includes('viral') || normalized.includes('memes')) return 'from-pink-600/20 to-rose-600/20 text-pink-400 border-pink-500/20';
  if (normalized.includes('finance')) return 'from-emerald-600/20 to-teal-600/20 text-emerald-400 border-emerald-500/20';
  if (normalized.includes('sports')) return 'from-orange-600/20 to-yellow-600/20 text-orange-400 border-orange-500/20';
  return 'from-gray-600/20 to-slate-600/20 text-gray-400 border-gray-500/20';
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '⚡';
    case 'negative': return '🔻';
    case 'viral': return '🚀';
    default: return '💎';
  }
};

export const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const isExplosive = trend.volumeScore > 90;
  
  return (
    <div className={`group relative bg-slate-900/40 border border-white/5 rounded-2xl p-5 hover:bg-slate-800/60 transition-all duration-300 hover:scale-[1.01] overflow-hidden ${isExplosive ? 'ring-1 ring-rose-500/30' : ''}`}>
      {/* Background Decorative Element */}
      <div className={`absolute -bottom-12 -right-12 w-32 h-32 blur-3xl rounded-full opacity-10 group-hover:opacity-20 transition-opacity bg-gradient-to-br ${getCategoryColor(trend.category)}`}></div>
      
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className={`inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-tighter bg-gradient-to-br ${getCategoryColor(trend.category)}`}>
            {trend.category}
          </div>
          {isExplosive && (
            <span className="bg-rose-600 text-[10px] font-black text-white px-2 py-0.5 rounded-md animate-pulse uppercase tracking-widest shadow-lg shadow-rose-900/50">
              Breaking
            </span>
          )}
        </div>
        
        <h3 className="text-lg font-black leading-tight mb-2 uppercase group-hover:text-white transition-colors">
          {trend.topic}
        </h3>
        
        <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6 line-clamp-2">
          {trend.description}
        </p>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>Velocity</span>
            <span className={isExplosive ? 'text-rose-500' : 'text-slate-300'}>
              {trend.volumeScore}% {getSentimentIcon(trend.sentiment)}
            </span>
          </div>
          <div className="w-full bg-white/5 h-1.5 rounded-full overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-[2000ms] ${isExplosive ? 'bg-gradient-to-r from-rose-600 to-orange-500' : 'bg-slate-600'}`}
              style={{ width: `${trend.volumeScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
