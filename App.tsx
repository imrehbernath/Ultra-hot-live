
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendTopic } from './types';
import { fetchTrendingTopics } from './services/geminiService';
import { TrendCard } from './components/TrendCard';

const App: React.FC = () => {
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [globalSummary, setGlobalSummary] = useState<string>("");
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(30);
  const [hasPaidKey, setHasPaidKey] = useState<boolean>(false);
  
  const timerRef = useRef<number | null>(null);

  const checkKeyStatus = useCallback(async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      const selected = await window.aistudio.hasSelectedApiKey();
      setHasPaidKey(selected);
      return selected;
    }
    return false;
  }, []);

  useEffect(() => {
    checkKeyStatus();
  }, [checkKeyStatus]);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasPaidKey(true);
      setError(null);
    }
  };

  const loadTrends = useCallback(async (isManual: boolean = false) => {
    if (loading || (!isActive && !isManual)) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingTopics();
      if (data.trends && data.trends.length > 0) {
        setTrends(data.trends.sort((a, b) => b.volumeScore - a.volumeScore));
        setGlobalSummary(data.globalSummary);
        setSources(data.sources);
        setLastUpdated(new Date());
        setNextUpdateIn(hasPaidKey ? 20 : 30); 
      }
    } catch (err: any) {
      if (err.message === "API_KEY_MISSING") {
        setError("API Key missing. Please configure your key.");
      } else {
        setError("Signal lost... reconnecting to uplink.");
      }
      setIsActive(false);
    } finally {
      setLoading(false);
    }
  }, [isActive, loading, hasPaidKey]);

  useEffect(() => {
    if (isActive) {
      timerRef.current = window.setInterval(() => {
        setNextUpdateIn((prev) => {
          if (prev <= 1) {
            loadTrends();
            return hasPaidKey ? 20 : 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, loadTrends, hasPaidKey]);

  const handleActivateSystem = async () => {
    const keyReady = await checkKeyStatus();
    if (!keyReady) {
      handleSelectKey();
      return;
    }
    setIsActive(true);
    loadTrends(true);
  };

  const exportToCSV = () => {
    if (trends.length === 0) return;
    // Exporting just the TOPICS in uppercase to match the user's provided example style
    const csvContent = trends.map(t => t.topic.toUpperCase()).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `TRENDS_${new Date().toISOString().split('T')[0]}.csv`);
    link.click();
  };

  return (
    <div className="min-h-screen bg-black text-white selection:bg-orange-500/30 overflow-x-hidden relative">
      {isActive && (
        <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden opacity-10">
          <div className="absolute top-0 left-0 w-full h-[2px] bg-orange-500 animate-[scan_4s_linear_infinite]"></div>
        </div>
      )}

      {/* TICKER */}
      <div className="bg-orange-600 overflow-hidden py-1.5 border-b border-orange-400/30 relative z-[60]">
        <div className="flex animate-[ticker_40s_linear_infinite] whitespace-nowrap">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center">
              {trends.length > 0 ? trends.map((t) => (
                <span key={t.id + i} className="mx-8 text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></span>
                  {t.topic} <span className="text-white">▲ {t.volumeScore}%</span>
                </span>
              )) : (
                <span className="mx-8 text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-2">
                  STATUS: {hasPaidKey ? 'READY' : 'KEY REQUIRED'} — AWAITING GLOBAL UPLINK...
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-[70] bg-black/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-[1400px] mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className={`w-3 h-3 rounded-full ${isActive ? 'bg-orange-500 shadow-[0_0_10px_#f97316]' : (hasPaidKey ? 'bg-green-500' : 'bg-red-500 animate-pulse')}`}></div>
            <h1 className="text-xl font-black italic tracking-tighter">
              TREND<span className="text-orange-500">MOLTEN</span>
            </h1>
          </div>

          <div className="flex gap-2">
            {trends.length > 0 && (
              <button onClick={exportToCSV} title="Export CSV Keywords" className="p-2 border border-white/10 rounded-full hover:bg-white/5 transition-colors">
                <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
              </button>
            )}
            {!isActive ? (
              <button onClick={handleActivateSystem} className="bg-orange-600 text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all">
                {hasPaidKey ? 'Connect Live' : 'Set API Key'}
              </button>
            ) : (
              <button onClick={() => setIsActive(false)} className="bg-white text-black px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">
                Stop Feed
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 py-12">
        {error && (
          <div className="mb-8 p-4 bg-red-900/20 border border-red-900/50 rounded-2xl text-red-500 text-xs font-bold text-center">
            {error}
          </div>
        )}

        {/* HERO & GLOBAL SUMMARY */}
        <div className="mb-12">
          {!isActive && trends.length === 0 ? (
            <div className="text-center py-20 space-y-8">
              <h2 className="text-7xl lg:text-9xl font-black tracking-tighter leading-none italic uppercase">
                Global <br/> <span className="text-orange-600 outline-text">Pulse.</span>
              </h2>
              <p className="text-slate-500 font-bold tracking-[0.3em] uppercase text-xs">AI-Driven Worldwide Intelligence</p>
              <button onClick={handleActivateSystem} className="bg-white text-black px-12 py-5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-all">
                Activate System
              </button>
            </div>
          ) : (
            globalSummary && (
              <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] p-8 md:p-12 mb-12 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6">
                  <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                    Live Global Report
                  </span>
                </div>
                <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-4">Current Global Outlook</h2>
                <p className="text-2xl md:text-3xl font-bold text-white leading-tight max-w-4xl italic">
                  "{globalSummary}"
                </p>
              </div>
            )
          )}
        </div>

        {/* TREND GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {loading && trends.length === 0 ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-64 bg-slate-900/40 rounded-3xl animate-pulse border border-white/5"></div>
            ))
          ) : (
            trends.map((trend) => (
              <TrendCard key={trend.id} trend={trend} />
            ))
          )}
        </div>

        {sources.length > 0 && (
          <div className="mt-20 py-10 border-t border-white/5">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Verification Sources (Google Search)</h3>
              <span className="text-[8px] font-black text-orange-500/50 uppercase tracking-widest">Grounding Active</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {sources.map((s, i) => (
                <a key={i} href={s.uri} target="_blank" rel="noopener noreferrer" className="bg-white/5 hover:bg-white/10 px-4 py-2 rounded-full text-[10px] font-bold text-slate-400 transition-colors border border-white/5">
                  {s.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-lg px-4">
        <div className="bg-slate-900/90 backdrop-blur-2xl border border-white/10 rounded-full px-8 py-4 flex items-center justify-between shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Next Refresh</span>
            <span className="text-xs font-mono font-bold text-orange-500">{isActive ? `${nextUpdateIn}s` : 'PAUSED'}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Last Uplink</span>
            <span className="text-xs font-mono font-bold">{isActive ? lastUpdated.toLocaleTimeString() : '--:--:--'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
