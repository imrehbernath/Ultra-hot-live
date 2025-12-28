
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendTopic } from './types';
import { fetchTrendingTopics } from './services/geminiService';
import { TrendCard } from './components/TrendCard';

const App: React.FC = () => {
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(20); // 20s for extreme freshness
  const timerRef = useRef<number | null>(null);

  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingTopics();
      if (data.length > 0) {
        // Strict sort by volumeScore (highest viral intensity first)
        const sorted = data.sort((a, b) => b.volumeScore - a.volumeScore);
        setTrends(sorted);
        setLastUpdated(new Date());
        setNextUpdateIn(20); 
      } else if (trends.length === 0) {
        setError("Establishing live connection to US discovery nodes...");
      }
    } catch (err) {
      console.error(err);
      setError("Data transmission interrupted. Retrying scan...");
    } finally {
      setLoading(false);
    }
  }, [trends.length]);

  useEffect(() => {
    loadTrends();
    
    timerRef.current = window.setInterval(() => {
      setNextUpdateIn((prev) => {
        if (prev <= 1) {
          loadTrends();
          return 20;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadTrends]);

  const exportToCSV = () => {
    const headers = ['Topic', 'Category', 'Description', 'Intensity', 'Sentiment', 'Detected_At'];
    const csvContent = [
      headers.join(','),
      ...trends.map(t => [
        `"${t.topic}"`,
        `"${t.category}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.volumeScore,
        t.sentiment,
        t.timestamp
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `USA_REALTIME_TRENDS_${new Date().toISOString()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#020408] text-slate-200 selection:bg-rose-500/30">
      {/* HUD Header */}
      <header className="sticky top-0 z-50 bg-[#020408]/90 backdrop-blur-3xl border-b border-white/5 px-4 md:px-8 py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <div className="relative flex items-center justify-center">
              <div className="absolute w-12 h-12 bg-rose-500/20 rounded-full animate-ping"></div>
              <div className="relative w-5 h-5 bg-rose-600 rounded-full border-2 border-white/20 shadow-[0_0_20px_rgba(225,29,72,1)]"></div>
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl md:text-3xl font-[900] tracking-tighter leading-none">
                  <span className="gradient-text">ULTRA-HOT</span>
                  <span className="text-white">.LIVE</span>
                </h1>
                <div className="flex items-center gap-2 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse"></span>
                  <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Live USA Scan</span>
                </div>
              </div>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next Signal Refresh:</span>
                  <span className="text-[10px] font-bold text-white uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">{nextUpdateIn}s</span>
                </div>
                <div className="h-1 w-32 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-rose-600 transition-all duration-1000 linear shadow-[0_0_8px_rgba(225,29,72,0.8)]" 
                    style={{ width: `${(nextUpdateIn / 20) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button 
              onClick={loadTrends}
              disabled={loading}
              className="px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all text-xs font-bold uppercase tracking-widest flex items-center gap-3 disabled:opacity-50 active:scale-95 shadow-lg shadow-black"
            >
              {loading ? <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>}
              Recalibrate
            </button>
            <button 
              onClick={exportToCSV}
              className="bg-white text-black px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-xl shadow-white/5 active:scale-95 flex items-center gap-3"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              Export CSV
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid Feed */}
      <main className="max-w-[1600px] mx-auto px-4 md:px-8 pt-10 pb-40">
        {error && (
          <div className="mb-10 p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-center">
            <span className="text-rose-500 font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              {error}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
          {loading && trends.length === 0 ? (
            Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="h-60 bg-white/5 border border-white/5 rounded-3xl animate-pulse" />
            ))
          ) : (
            trends.map((trend, idx) => (
              <div key={trend.id} className="relative group animate-in fade-in slide-in-from-bottom-2 duration-500">
                <TrendCard trend={trend} />
                <div className="absolute top-4 left-4 w-7 h-7 bg-black border border-white/10 rounded-lg flex items-center justify-center text-[11px] font-black text-slate-500 z-20 group-hover:text-rose-500 group-hover:border-rose-500/50 transition-all">
                  #{idx + 1}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Status Deck */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-3xl px-4">
        <div className="bg-[#0a0f1e]/90 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-8 py-4 flex items-center justify-between shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Global Intensity</span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-white uppercase tracking-tighter">Rising Peaks</span>
                <div className="flex gap-0.5">
                  <div className="w-1 h-3 bg-emerald-500 rounded-full animate-bounce"></div>
                  <div className="w-1 h-4 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.1s]"></div>
                  <div className="w-1 h-2 bg-emerald-500 rounded-full animate-bounce [animation-delay:0.2s]"></div>
                </div>
              </div>
            </div>
            <div className="w-px h-8 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-0.5">Last Transmission</span>
              <span className="text-xs font-bold text-emerald-400 font-mono tracking-wider">{lastUpdated.toLocaleTimeString()}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-4 bg-white/5 px-4 py-2 rounded-2xl border border-white/10">
            <div className="relative">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,1)] animate-pulse"></div>
            </div>
            <span className="text-[10px] font-black text-white uppercase tracking-[0.25em]">Realtime Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
