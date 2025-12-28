
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { TrendTopic } from './types';
import { fetchTrendingTopics } from './services/geminiService';
import { TrendCard } from './components/TrendCard';

const App: React.FC = () => {
  const [trends, setTrends] = useState<TrendTopic[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [isActive, setIsActive] = useState<boolean>(false); // System operational state
  const [isLiveMode, setIsLiveMode] = useState<boolean>(false); // Auto-refresh toggle
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [nextUpdateIn, setNextUpdateIn] = useState<number>(30); // Default to 30s to save quota
  const [showScrollTop, setShowScrollTop] = useState<boolean>(false);
  const timerRef = useRef<number | null>(null);

  const loadTrends = useCallback(async (isManual: boolean = false) => {
    // Prevent overlapping loads or loading when not active (unless manual)
    if (loading || (!isActive && !isManual)) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await fetchTrendingTopics();
      if (data.length > 0) {
        const sorted = data.sort((a, b) => b.volumeScore - a.volumeScore);
        setTrends(sorted);
        setLastUpdated(new Date());
        setNextUpdateIn(30); // Reset timer
      } else if (trends.length === 0) {
        setError("Scanning for active US signals and crypto tickers...");
      }
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.message || JSON.stringify(err);
      if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        setError("QUOTA EXCEEDED: The Gemini API limit has been reached. Please wait 60 seconds and try a manual pulse.");
        setIsLiveMode(false); // Disable auto-refresh on quota error
      } else {
        setError("Uplink failed. Check your connection or API key status.");
      }
    } finally {
      setLoading(false);
    }
  }, [isActive, loading, trends.length]);

  // Handle refresh timer for Live Mode
  useEffect(() => {
    if (isActive && isLiveMode) {
      timerRef.current = window.setInterval(() => {
        setNextUpdateIn((prev) => {
          if (prev <= 1) {
            loadTrends();
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, isLiveMode, loadTrends]);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleActivateSystem = () => {
    setIsActive(true);
    if (trends.length === 0) {
      loadTrends(true);
    }
  };

  const handleSinglePulse = () => {
    loadTrends(true);
  };

  const toggleLiveMode = () => {
    setIsLiveMode(!isLiveMode);
    if (!isLiveMode && isActive) {
      setNextUpdateIn(30);
    }
  };

  const exportToCSV = () => {
    if (trends.length === 0) return;
    const csvRows = trends.map(t => t.topic.replace('$', '').toUpperCase().trim());
    const csvContent = csvRows.join('\r\n');
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `TRENDMAX_EXPORT_${new Date().getTime()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-[#010204] text-slate-100 selection:bg-amber-500/40 selection:text-white">
      {/* HUD Header */}
      <header className="sticky top-0 z-50 bg-[#010204]/95 backdrop-blur-3xl border-b border-white/5 px-6 py-4">
        <div className="max-w-[1800px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className={`absolute -inset-2 blur-xl rounded-full transition-all duration-700 ${isActive ? (isLiveMode ? 'bg-emerald-500/20' : 'bg-rose-500/20') : 'bg-slate-600/10'}`}></div>
              <div className={`relative w-4 h-4 rounded-full border-2 border-white/20 transition-all duration-700 ${isActive ? (isLiveMode ? 'bg-emerald-500 shadow-[0_0_15px_#10b981]' : 'bg-rose-500 shadow-[0_0_15px_#f43f5e]') : 'bg-slate-700'}`}></div>
            </div>
            <div>
              <div className="flex items-center gap-4">
                <h1 className="text-3xl font-[1000] tracking-tighter">
                  <span className="gradient-text">TREND</span>
                  <span className="text-white">MAX</span>
                </h1>
                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[10px] font-black tracking-widest transition-colors ${isActive ? 'bg-white/5 border-white/10' : 'bg-slate-800/50 border-white/5 text-slate-500'}`}>
                   {isActive ? (isLiveMode ? 'LIVE FEED ACTIVE' : 'MANUAL MODE') : 'SYSTEM OFFLINE'}
                </div>
              </div>
              {isActive && (
                <div className="flex items-center gap-6 mt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Next Pulse:</span>
                    <span className={`text-[11px] font-bold font-mono ${isLiveMode ? 'text-emerald-400' : 'text-slate-500'}`}>{isLiveMode ? `${nextUpdateIn}s` : 'PAUSED'}</span>
                  </div>
                  {isLiveMode && (
                    <div className="h-0.5 w-32 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 transition-all duration-1000 linear" style={{ width: `${(nextUpdateIn / 30) * 100}%` }} />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isActive ? (
              <button 
                onClick={handleActivateSystem}
                className="px-8 py-3.5 bg-white text-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-rose-500 hover:text-white transition-all active:scale-95 shadow-xl"
              >
                Initial Activation
              </button>
            ) : (
              <>
                <button 
                  onClick={handleSinglePulse}
                  disabled={loading}
                  className="px-6 py-3.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 disabled:opacity-50 transition-all"
                >
                  {loading ? <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>}
                  Single Pulse
                </button>
                <button 
                  onClick={toggleLiveMode}
                  className={`px-6 py-3.5 border rounded-2xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 ${isLiveMode ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500 hover:bg-emerald-500/20' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                >
                  <div className={`w-2 h-2 rounded-full ${isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-slate-600'}`}></div>
                  Live Auto-Refresh
                </button>
              </>
            )}
            
            <button 
              onClick={exportToCSV}
              disabled={trends.length === 0}
              className="bg-amber-500 text-black px-8 py-3.5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-amber-400 transition-all shadow-lg active:scale-95 flex items-center gap-2 disabled:opacity-20 disabled:grayscale"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              CSV Export
            </button>
          </div>
        </div>
      </header>

      {/* Main Grid */}
      <main className="max-w-[1800px] mx-auto px-6 pt-12 pb-48">
        {!isActive && trends.length === 0 && (
          <div className="flex flex-col items-center justify-center py-32 text-center animate-in fade-in duration-1000">
             <div className="w-32 h-32 mb-12 relative">
                <div className="absolute inset-0 bg-rose-600/20 blur-3xl animate-pulse"></div>
                <svg className="w-full h-full text-white/5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="0.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" /></svg>
             </div>
             <h2 className="text-5xl font-[1000] tracking-tighter mb-4">SYSTEM READY</h2>
             <p className="text-slate-500 font-bold uppercase tracking-[0.4em] text-sm mb-12 max-w-lg mx-auto">Click activation to establish uplink and start discovering real-time US viral trends and crypto alpha.</p>
             <button 
               onClick={handleActivateSystem}
               className="group relative px-16 py-7 bg-white text-black rounded-[2.5rem] font-black text-xl uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl"
             >
               <span className="relative z-10">Initialize Uplink</span>
               <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-amber-500 opacity-0 group-hover:opacity-10 transition-opacity rounded-[2.5rem]"></div>
             </button>
          </div>
        )}

        {error && (
          <div className="mb-12 p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center animate-in slide-in-from-top-4 duration-500">
            <div className="flex items-center justify-center gap-3 text-rose-500 font-black uppercase tracking-widest text-sm mb-4">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              Signal Error
            </div>
            <p className="text-rose-400/80 font-bold text-lg max-w-2xl mx-auto">{error}</p>
            {error.includes('QUOTA') && (
              <button 
                onClick={handleSinglePulse}
                className="mt-6 px-8 py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-400 transition-all active:scale-95"
              >
                Try Manual Pulse Again
              </button>
            )}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 3xl:grid-cols-6 gap-6">
          {loading && trends.length === 0 ? (
            Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="h-64 bg-white/[0.02] border border-white/5 rounded-[2.5rem] animate-pulse" />
            ))
          ) : (
            trends.map((trend, idx) => (
              <div key={trend.id} className="relative group animate-in fade-in zoom-in-95 duration-500" style={{ animationDelay: `${idx * 40}ms` }}>
                <TrendCard trend={trend} />
                <div className="absolute top-5 left-5 w-8 h-8 bg-[#010204]/90 backdrop-blur rounded-xl flex items-center justify-center text-[10px] font-black text-slate-500 border border-white/10 z-20 group-hover:text-amber-500 group-hover:border-amber-500/40 transition-all shadow-xl">
                  {idx + 1}
                </div>
              </div>
            ))
          )}
        </div>
      </main>

      {/* Floating Action Elements */}
      <div className="fixed bottom-10 right-10 flex flex-col gap-4 z-50">
        <button
          onClick={scrollToTop}
          className={`p-5 bg-white/10 backdrop-blur-3xl border border-white/20 rounded-[2rem] text-white shadow-2xl transition-all duration-500 hover:bg-rose-600 hover:border-rose-500 hover:-translate-y-2 active:scale-90 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 11l7-7m0 0l7 7m-7-7v14" /></svg>
        </button>
      </div>

      {/* Bottom Status Hub */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60] w-full max-w-4xl px-4 pointer-events-none">
        <div className="bg-[#0a0c12]/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] px-12 py-6 flex items-center justify-between shadow-[0_40px_80px_rgba(0,0,0,0.8)] pointer-events-auto">
          <div className="flex items-center gap-10">
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1.5">DATA SOURCE</span>
              <div className="flex items-center gap-2">
                <span className={`text-sm font-bold tracking-tight transition-colors ${isActive ? 'text-white' : 'text-slate-600'}`}>
                  {isActive ? (isLiveMode ? 'REAL-TIME MESH' : 'SINGLE UPLINK') : 'NO CONNECTION'}
                </span>
                <span className={`w-2 h-2 rounded-full transition-colors ${isActive ? (isLiveMode ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500') : 'bg-slate-800'}`}></span>
              </div>
            </div>
            <div className="w-px h-10 bg-white/10"></div>
            <div className="flex flex-col">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1.5">LAST SYNC</span>
              <span className={`text-sm font-mono font-bold tracking-widest transition-colors ${isActive && trends.length > 0 ? 'text-amber-500' : 'text-slate-700'}`}>
                {trends.length > 0 ? lastUpdated.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
              </span>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6 bg-white/5 px-8 py-3 rounded-full border border-white/5">
            <div className="flex gap-1.5 items-end h-4">
              <div className={`w-1.5 rounded-full transition-all duration-300 ${isActive ? (isLiveMode ? 'bg-emerald-500 h-full animate-pulse' : 'bg-rose-500 h-2') : 'bg-slate-800 h-1'}`}></div>
              <div className={`w-1.5 rounded-full transition-all duration-300 delay-75 ${isActive ? (isLiveMode ? 'bg-emerald-500 h-3 animate-pulse' : 'bg-rose-500 h-4') : 'bg-slate-800 h-1'}`}></div>
              <div className={`w-1.5 rounded-full transition-all duration-300 delay-150 ${isActive ? (isLiveMode ? 'bg-emerald-500 h-5 animate-pulse' : 'bg-rose-500 h-3') : 'bg-slate-800 h-1'}`}></div>
            </div>
            <span className={`text-[9px] font-black uppercase tracking-[0.4em] transition-opacity ${isActive ? 'text-white' : 'text-slate-600'}`}>
              {isActive ? (isLiveMode ? 'STREAMING VELOCITY' : 'SIGNAL LOCKED') : 'SYSTEM STANDBY'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
