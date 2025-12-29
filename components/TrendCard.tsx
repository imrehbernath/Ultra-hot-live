
import React from 'react';
import { TrendTopic } from '../types';

interface TrendCardProps {
  trend: TrendTopic;
}

const getCategoryStyles = (category: string) => {
  const cat = category.toUpperCase();
  if (cat.includes('BREAKING')) return 'from-red-600 to-orange-600 text-white border-red-500 shadow-[0_0_15px_rgba(220,38,38,0.5)]';
  if (cat.includes('HOT')) return 'from-orange-500 to-yellow-500 text-black border-orange-400';
  if (cat.includes('VIRAL')) return 'from-pink-600 to-purple-600 text-white border-pink-500';
  if (cat.includes('TECH')) return 'from-cyan-500 to-blue-600 text-white border-cyan-400';
  return 'from-slate-700 to-slate-900 text-slate-300 border-slate-600';
};

export const TrendCard: React.FC<TrendCardProps> = ({ trend }) => {
  const isSuperHot = trend.volumeScore > 90;
  
  return (
    <div className={`group relative h-full bg-slate-900/40 border-t border-l border-white/10 rounded-3xl p-6 transition-all duration-300 hover:-translate-y-2 ${isSuperHot ? 'ring-1 ring-orange-500/50' : ''}`}>
      <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 rounded-3xl transition-opacity duration-500 bg-gradient-to-br ${getCategoryStyles(trend.category)}`}></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <div className="flex gap-2">
            <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border ${getCategoryStyles(trend.category)}`}>
              {trend.category}
            </span>
            <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-tighter border border-white/10 bg-white/5 text-slate-400">
              {trend.location}
            </span>
          </div>
          {isSuperHot && (
            <div className="flex gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-ping"></span>
            </div>
          )}
        </div>

        <h3 className={`text-2xl font-black leading-none mb-3 tracking-tighter transition-colors ${isSuperHot ? 'text-orange-400' : 'text-white'}`}>
          {trend.topic}
        </h3>

        <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
          {trend.description}
        </p>

        <div className="mt-auto pt-4 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[9px] font-black text-slate-500 tracking-widest uppercase">Heat Index</span>
            <span className="text-xs font-black text-white">{trend.volumeScore}%</span>
          </div>
          <div className="h-1 w-full bg-slate-800 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-1000 ${isSuperHot ? 'bg-gradient-to-r from-red-600 via-orange-500 to-yellow-400' : 'bg-blue-500'}`}
              style={{ width: `${trend.volumeScore}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};
