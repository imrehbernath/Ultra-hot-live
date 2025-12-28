
import React from 'react';
import { TrendTopic } from '../types';

interface TrendCardProps {
  trend: TrendTopic;
}

const getCategoryStyles = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('catalyst')) return 'from-purple-600/30 to-indigo-600/10 text-purple-400 border-purple-500/20';
  if (normalized.includes('hype')) return 'from-blue-600/30 to-cyan-600/10 text-blue-400 border-blue-500/20';
  if (normalized.includes('tech')) return 'from-cyan-600/30 to-blue-600/10 text-cyan-400 border-cyan-500/20';
  if (normalized.includes('meme')) return 'from-pink-600/30 to-rose-600/10 text-pink-400 border-pink-500/20';
  if (normalized.includes('sports')) return 'from-orange-600/30 to-yellow-600/10 text-orange-400 border-orange-500/20';
  if (normalized.includes('entertainment')) return 'from-emerald-600/30 to-teal-600/10 text-emerald-400 border-emerald-500/20';
  return 'from-gray-600/30 to-slate-600/10 text-gray-300 border-gray-500/20';
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '🔥';
    case 'negative': return '🔻';
    case 'viral': return '🚀';
    case 'neutral': return '💎';
    default: return '⚡';
  }
};

export const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const isExplosive = trend.volumeScore > 85;
  
  return (
    <div className={`group relative h-full bg-[#0a0c12]/60 border border-white/[0.05] rounded-[2rem] p-6 hover:bg-[#0a0c12]/90 transition-all duration-500 hover:scale-[1.03] hover:shadow-[0_20px_40px_rgba(0,0,0,0.6)] overflow-hidden ${isExplosive ? 'ring-2 ring-amber-500/30' : ''}`}>
      {/* Background Glow */}
      <div className={`absolute -bottom-10 -right-10 w-40 h-40 blur-[80px] rounded-full opacity-0 group-hover:opacity-30 transition-all duration-700 bg-gradient-to-br ${getCategoryStyles(trend.category)}`}></div>
      
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-black border uppercase tracking-wider bg-gradient-to-br ${getCategoryStyles(trend.category)}`}>
            {trend.category}
          </div>
          {isExplosive && (
            <span className="text-[8px] font-black text-black bg-amber-500 px-2 py-0.5 rounded-md animate-pulse uppercase tracking-widest shadow-[0_0_10px_#f59e0b]">
              HIGH APY
            </span>
          )}
        </div>
        
        <h3 className="text-2xl font-[1000] leading-tight mb-2 uppercase tracking-tighter text-white group-hover:text-amber-400 transition-colors">
          {trend.topic}
        </h3>
        
        <p className="text-slate-500 text-[11px] font-bold leading-tight mb-8 line-clamp-3 group-hover:text-slate-300 transition-colors">
          {trend.description}
        </p>
        
        <div className="mt-auto space-y-3">
          <div className="flex items-center justify-between text-[9px] font-black uppercase tracking-[0.2em] text-slate-600">
            <span>MEME VELOCITY</span>
            <span className={`flex items-center gap-1.5 ${isExplosive ? 'text-amber-500' : 'text-slate-400'}`}>
              {trend.volumeScore}% {getSentimentIcon(trend.sentiment)}
            </span>
          </div>
          <div className="w-full bg-white/[0.03] h-1.5 rounded-full overflow-hidden border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-[2000ms] ${isExplosive ? 'bg-gradient-to-r from-amber-600 to-yellow-300 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}
              style={{ width: `${trend.volumeScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
