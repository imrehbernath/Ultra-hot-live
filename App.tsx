
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendTopic } from './types';
import { fetchTrendingTopics } from './services/geminiService';
import { TrendCard } from './components/TrendCard';

declare global {
  interface AIStudio {
    hasSelectedApiKey: () => Promise<boolean>;
    openSelectKey: () => Promise<void>;
  }
}

const App: React.FC = () => {
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [sources, setSources] = useState<{ title: string; uri: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false); 
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false); 
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(60);
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const [quotaBlocked, setQuotaBlocked] = useState<boolean>(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [hasPaidKey, setHasPaidKey] = useState<boolean>(false);
  
  const timerRef = useRef<number | null>(null);
  const cooldownRef = useRef<number | null>(null);

  useEffect(() => {
    const checkKey = async () => {
      // @ts-ignore
      if (window.aistudio) {
        // @ts-ignore
        const selected = await window.aistudio.hasSelectedApiKey();
        setHasPaidKey(selected);
      }
    };
    checkKey();
  }, []);

  const handleSelectKey = async () => {
    // @ts-ignore
    if (window.aistudio) {
      // @ts-ignore
      await window.aistudio.openSelectKey();
      setHasPaidKey(true);
      setQuotaBlocked(false);
      setError(null);
    }
  };

  const handleSystemStop = useCallback(() => {
    setIsActive(false);
    setIsLiveMode(false);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  const loadTrends = useCallback(async (isManual: boolean = false) => {
    if (loading || (!isActive && !isManual) || quotaBlocked) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingTopics();
      if (data.trends && data.trends.length > 0) {
        const sorted = data.trends.sort((a, b) => b.volumeScore - a.volumeScore);
        setTrends(sorted);
        setSources(data.sources);
        setLastUpdated(new Date());
        setNextUpdateIn(hasPaidKey ? 30 : 60); 
        setQuotaBlocked(false);
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      const errorStr = String(err);
      
      if (errorStr.includes("Requested entity was not found.")) {
        setHasPaidKey(false);
        handleSelectKey();
        return;
      }

      if (errorStr.includes('429') || errorStr.includes('quota') || errorStr.includes('RESOURCE_EXHAUSTED')) {
        handleSystemStop(); 
        setQuotaBlocked(true);
        const cooldown = hasPaidKey ? 30 : 60;
        setCooldownSeconds(cooldown);
        setError(hasPaidKey ? "API REFRESH DELAY. Wait a few seconds." : "FREE TIER QUOTA REACHED. Wait 60s or use a Paid Key.");
      } else {
        setError("Uplink failed. Retrying signal...");
      }
    } finally {
      setLoading(false);
    }
  }, [isActive, loading, quotaBlocked, handleSystemStop, hasPaidKey]);

  useEffect(() => {
    if (isActive && isLiveMode && !quotaBlocked) {
      timerRef.current = window.setInterval(() => {
        setNextUpdateIn((prev) => {
          if (prev <= 1) {
            loadTrends();
            return hasPaidKey ? 30 : 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isActive, isLiveMode, loadTrends, quotaBlocked, hasPaidKey]);

  useEffect(() => {
    if (quotaBlocked && cooldownSeconds > 0) {
      cooldownRef.current = window.setInterval(() => {
        setCooldownSeconds(prev => {
          if (prev <= 1) {
            setQuotaBlocked(false);
            if (cooldownRef.current) clearInterval(cooldownRef.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, [quotaBlocked, cooldownSeconds]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 300);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleActivateSystem = () => {
    if (quotaBlocked) return;
    setQuotaBlocked(false);
    setError(null);
    setIsActive(true);
    loadTrends(true);
  };

  const exportToCSV = () => {
    if (trends.length === 0) return;
    // Remove the '$' sign and ensure uppercase for the CSV export
    const csvContent = trends.map(t => t.topic.replace('$', '').toUpperCase().trim()).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TREND_KEYWORDS_${new Date().getTime()}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-[#010204] text-slate-100 selection:bg-amber-500/40 selection:text-white">
      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#010204]/95 backdrop-blur-3xl border-b border-white/5 px-6 py-4 shadow-2xl">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`absolute -inset-2 blur-xl rounded-full transition-all duration-700 ${isActive ? (isLiveMode ? 'bg-emerald-500/30' : 'bg-amber-500/30') : 'bg-slate-800/20'}`}></div>
              <div className={`relative w-4 h-4 rounded-full border-2 border-white/20 transition-all duration-700 ${isActive ? (isLiveMode ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-amber-500 shadow-[0_0_15px_#f59e0b]') : 'bg-slate-700'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-[1000] tracking-tighter">
                  <span className="gradient-text">TICKER</span>
                  <span className="text-white">GEN</span>
                </h1>
                <div className="flex gap-2">
                  <div className={`px-3 py-1 rounded-full border text-[10px] font-black tracking-widest transition-all ${isActive ? 'bg-amber-500/10 border-amber-500/20 text-amber-500' : 'bg-slate-900 border-white/5 text-slate-500'}`}>
                    {quotaBlocked ? 'COOLDOWN' : isActive ? 'GEN ACTIVE' : 'STANDBY'}
                  </div>
                  {hasPaidKey && (
                    <div className="px-3 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-500 text-[10px] font-black tracking-widest">
                      VIP UPLINK
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!hasPaidKey && (
              <button onClick={handleSelectKey} className="px-4 py-3 bg-amber-500/10 hover:bg-amber-500 border border-amber-500/30 text-amber-500 hover:text-black rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">
                Connect Paid Key
              </button>
            )}
            {!isActive && !quotaBlocked ? (
              <button onClick={handleActivateSystem} className="px-8 py-3.5 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-500 hover:text-white transition-all shadow-xl active:scale-95">
                START SCANNER
              </button>
            ) : (
              <>
                {!quotaBlocked && (
                  <>
                    <button onClick={() => loadTrends(true)} disabled={loading} className="px-5 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-all disabled:opacity-20">
                      {loading ? 'GEN...' : 'NEW TICKERS'}
                    </button>
                    <button onClick={() => setIsLiveMode(!isLiveMode)} className={`px-5 py-3.5 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${isLiveMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : 'bg-white/5 border-white/10 text-white'}`}>
                      LIVE {isLiveMode ? 'ON' : 'OFF'}
                    </button>
                  </>
                )}
                <button onClick={handleSystemStop} className="px-5 py-3.5 bg-rose-600/20 hover:bg-rose-600 text-rose-500 hover:text-white border border-rose-500/30 rounded-2xl text-xs font-black uppercase tracking-widest transition-all">
                  STOP
                </button>
              </>
            )}
            <button onClick={exportToCSV} disabled={trends.length === 0} className="bg-slate-100 text-black px-6 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white transition-all shadow-lg disabled:opacity-20">
              CSV LIST
            </button>
          </div>
        </div>
      </header>

      {/* MAIN CONTENT */}
      <main className="max-w-[1800px] mx-auto px-6 pt-12 pb-48">
        {quotaBlocked && (
          <div className="mb-12 p-12 bg-rose-600/5 border-2 border-rose-500/20 rounded-[3rem] text-center backdrop-blur-xl animate-in zoom-in duration-500">
            <h2 className="text-4xl font-[1000] text-rose-500 mb-4 uppercase tracking-tighter">LIMIT REACHED</h2>
            <p className="text-slate-300 font-bold text-xl mb-6">Gemini Free Tier has tight limits. Upgrade for continuous scanning.</p>
            {!hasPaidKey && (
              <div className="flex flex-col sm:flex-row justify-center gap-4 mb-8">
                <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" rel="noopener noreferrer" className="px-8 py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 transition-all text-xs">Billing Docs</a>
                <button onClick={handleSelectKey} className="px-8 py-4 bg-amber-500/20 border border-amber-500/40 text-amber-500 rounded-2xl font-black uppercase tracking-widest hover:bg-amber-500 hover:text-black transition-all text-xs">Switch to Paid Key</button>
              </div>
            )}
            <div className="text-rose-400 font-mono text-3xl font-black">RETRY IN: {cooldownSeconds}s</div>
          </div>
        )}

        {!isActive && !quotaBlocked && trends.length === 0 && (
          <div className="py-40 text-center animate-in fade-in duration-1000">
             <div className="w-24 h-24 mb-10 mx-auto text-amber-500/20"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
             <h2 className="text-6xl font-[1000] tracking-tighter mb-4 uppercase">DEGEN TICKER SCANNER</h2>
             <p className="text-slate-500 font-black uppercase tracking-[0.3em] mb-12">Generating Meme Coin Keywords from Real-Time US Viral Trends.</p>
             <button onClick={handleActivateSystem} className="px-16 py-8 bg-white text-black rounded-[2.5rem] font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl">CONNECT TO STREAM</button>
          </div>
        )}

        {error && !quotaBlocked && (
          <div className="mb-8 p-6 bg-amber-500/5 border border-amber-500/20 rounded-2xl text-center text-amber-400 font-bold uppercase tracking-widest text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
          {loading && trends.length === 0 ? (
            Array.from({ length: 18 }).map((_, i) => (
              <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-[2.5rem] animate-pulse" />
            ))
          ) : (
            trends.map((trend, idx) => (
              <div key={trend.id} className="relative group animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
                <TrendCard trend={trend} />
                <div className="absolute top-5 left-5 w-8 h-8 bg-black/80 backdrop-blur rounded-lg flex items-center justify-center text-[10px] font-black text-slate-600 border border-white/10 z-20 group-hover:text-amber-500 transition-all">
                  #{idx + 1}
                </div>
              </div>
            ))
          )}
        </div>

        {sources.length > 0 && (
          <div className="mt-24 pt-12 border-t border-white/5 animate-in fade-in duration-1000">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-8 text-center">Trend Validation Sources</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {sources.map((source, i) => (
                <a key={i} href={source.uri} target="_blank" rel="noopener noreferrer" className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-[10px] font-bold text-slate-400 hover:text-white transition-all flex items-center gap-2">
                  <span className="w-1 h-1 bg-amber-500 rounded-full"></span>
                  {source.title.length > 35 ? source.title.substring(0, 35) + '...' : source.title}
                </a>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* FOOTER STATUS */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-2xl px-4 pointer-events-none">
        <div className="bg-[#0a0c12]/95 backdrop-blur-3xl border border-white/10 rounded-[2rem] px-10 py-6 flex items-center justify-between shadow-2xl pointer-events-auto">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">LAST GENERATION</span>
            <span className="text-sm font-mono font-bold text-amber-500">{trends.length > 0 ? lastUpdated.toLocaleTimeString() : '--:--:--'}</span>
          </div>
          <div className="flex flex-col items-center">
             <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">REFRESH</span>
             <span className="text-xs font-black text-white">{isActive && isLiveMode ? `${nextUpdateIn}s` : 'STOPPED'}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">ENGINE</span>
            <span className={`text-sm font-bold ${isActive ? 'text-amber-500' : 'text-slate-500'}`}>{isActive ? 'LIVE SCAN' : 'IDLE'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
