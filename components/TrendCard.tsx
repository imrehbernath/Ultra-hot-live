
import React from 'react';
import { TrendTopic } from '../types';

interface TrendCardProps {
  trend: TrendTopic;
}

const getCategoryStyles = (category: string) => {
  const normalized = category.toLowerCase();
  if (normalized.includes('entertainment')) return 'from-purple-600/30 to-indigo-600/10 text-purple-400 border-purple-500/20';
  if (normalized.includes('tech') || normalized.includes('gaming')) return 'from-blue-600/30 to-cyan-600/10 text-blue-400 border-blue-500/20';
  if (normalized.includes('news')) return 'from-red-600/30 to-orange-600/10 text-red-400 border-red-500/20';
  if (normalized.includes('viral') || normalized.includes('memes')) return 'from-pink-600/30 to-rose-600/10 text-pink-400 border-pink-500/20';
  if (normalized.includes('finance')) return 'from-emerald-600/30 to-teal-600/10 text-emerald-400 border-emerald-500/20';
  if (normalized.includes('sports')) return 'from-orange-600/30 to-yellow-600/10 text-orange-400 border-orange-500/20';
  if (normalized.includes('crypto')) return 'from-amber-500/30 to-yellow-600/10 text-amber-400 border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]';
  return 'from-gray-600/30 to-slate-600/10 text-gray-300 border-gray-500/20';
};

const getSentimentIcon = (sentiment: string) => {
  switch (sentiment) {
    case 'positive': return '⚡';
    case 'negative': return '⚠️';
    case 'viral': return '🚀';
    case 'neutral': return '🔹';
    default: return '💎';
  }
};

export const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const isExplosive = trend.volumeScore > 92;
  const isCrypto = trend.category.toLowerCase().includes('crypto');
  
  return (
    <div className={`group relative h-full bg-[#0a0c12]/40 border border-white/[0.05] rounded-[2rem] p-6 hover:bg-[#0a0c12]/80 transition-all duration-500 hover:scale-[1.02] hover:shadow-[0_20px_40px_rgba(0,0,0,0.5)] overflow-hidden ${isExplosive ? 'ring-2 ring-rose-600/30' : ''} ${isCrypto ? 'ring-1 ring-amber-500/20' : ''}`}>
      {/* Dynamic Background Glow */}
      <div className={`absolute -bottom-20 -right-20 w-48 h-48 blur-[100px] rounded-full opacity-0 group-hover:opacity-40 transition-all duration-700 bg-gradient-to-br ${getCategoryStyles(trend.category)}`}></div>
      
      <div className="flex flex-col h-full relative z-10">
        <div className="flex items-start justify-between mb-5">
          <div className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-[0.1em] bg-gradient-to-br ${getCategoryStyles(trend.category)}`}>
            {trend.category}
          </div>
          {isExplosive && (
            <span className={`text-[9px] font-[1000] text-white px-2.5 py-1 rounded-lg animate-pulse uppercase tracking-widest shadow-lg ${isCrypto ? 'bg-amber-500 shadow-amber-900/50' : 'bg-rose-600 shadow-rose-900/50'}`}>
              {isCrypto ? 'MOONING' : 'CRITICAL'}
            </span>
          )}
        </div>
        
        <h3 className={`text-xl font-[1000] leading-tight mb-3 uppercase tracking-tight transition-colors ${isCrypto ? 'text-amber-400 group-hover:text-amber-300' : 'text-white/90 group-hover:text-white'}`}>
          {trend.topic}
        </h3>
        
        <p className="text-slate-400 text-xs font-semibold leading-relaxed mb-8 line-clamp-3 group-hover:text-slate-200 transition-colors">
          {trend.description}
        </p>
        
        <div className="mt-auto space-y-4">
          <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
            <span className="group-hover:text-slate-400 transition-colors">Intensity Index</span>
            <span className={`flex items-center gap-1.5 ${isExplosive ? (isCrypto ? 'text-amber-500' : 'text-rose-500') : 'text-slate-300'}`}>
              {trend.volumeScore}% {getSentimentIcon(trend.sentiment)}
            </span>
          </div>
          <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden p-[2px] border border-white/5">
            <div 
              className={`h-full rounded-full transition-all duration-[2500ms] cubic-bezier(0.4, 0, 0.2, 1) ${isExplosive ? (isCrypto ? 'bg-gradient-to-r from-amber-600 via-yellow-500 to-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-gradient-to-r from-rose-600 via-orange-500 to-yellow-400 shadow-[0_0_10px_rgba(225,29,72,0.5)]') : 'bg-slate-700 group-hover:bg-slate-400'}`}
              style={{ width: `${trend.volumeScore}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
