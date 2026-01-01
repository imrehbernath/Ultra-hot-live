
import React, { useState, useRef } from 'react';
import { ScreenshotAnalysis } from '../types';
import { analyzeScreenshot } from '../services/geminiService';

export const ScreenshotScanner: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScreenshotAnalysis | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => setPreview(reader.result as string);
      reader.readAsDataURL(selected);
      setResult(null);
      setError(null);
    }
  };

  const handleAnalyze = async () => {
    if (!preview || !file) return;
    setLoading(true);
    setError(null);
    try {
      const base64Data = preview.split(',')[1];
      const analysis = await analyzeScreenshot(base64Data, file.type);
      setResult(analysis);
    } catch (err: any) {
      setError("Analysis failed. Ensure image is clear and valid.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const exportAnalysisCSV = () => {
    if (!result) return;
    const csvContent = result.scored_tokens
      .map(t => t.name.toUpperCase())
      .join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SCAN_KEYWORDS_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row gap-8">
        {/* UPLOAD SECTION */}
        <div className="flex-1 space-y-4">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={`aspect-video rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative group ${
              preview ? 'border-orange-500/50' : 'border-white/10 hover:border-orange-500/30 hover:bg-white/5'
            }`}
          >
            {preview ? (
              <>
                <img src={preview} alt="Upload Preview" className="w-full h-full object-cover opacity-50 group-hover:opacity-70 transition-opacity" />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <span className="bg-black/80 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">Image Captured</span>
                  <span className="text-white font-bold text-xs">Click to swap screenshot</span>
                </div>
              </>
            ) : (
              <div className="p-10 text-center">
                <svg className="w-12 h-12 text-slate-700 mb-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Drop pump.fun or DEX screenshot</p>
              </div>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
          </div>

          <button 
            onClick={handleAnalyze} 
            disabled={!file || loading}
            className={`w-full py-4 rounded-full font-black text-xs uppercase tracking-widest transition-all ${
              !file || loading 
                ? 'bg-white/5 text-slate-700 cursor-not-allowed' 
                : 'bg-orange-600 text-black hover:scale-[1.02] shadow-[0_10px_30px_rgba(234,88,12,0.3)]'
            }`}
          >
            {loading ? 'Analyzing Signal...' : 'Initiate Scan'}
          </button>
          
          {error && <p className="text-red-500 text-[10px] font-black uppercase text-center">{error}</p>}
        </div>

        {/* SUMMARY SECTION */}
        {result && (
          <div className="w-full md:w-80 space-y-4">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-4">Market Sentiment</h3>
              <p className="text-sm font-bold text-slate-300 italic">"{result.market_sentiment}"</p>
            </div>
            
            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-4">Top Picks</h3>
              <div className="flex flex-wrap gap-2">
                {result.top_picks.map((p, i) => (
                  <span key={i} className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-full text-[10px] font-black text-green-500">{p}</span>
                ))}
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-3xl p-6">
              <h3 className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-4">Avoid List</h3>
              <div className="flex flex-wrap gap-2">
                {result.avoid.map((p, i) => (
                  <span key={i} className="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[10px] font-black text-red-500">{p}</span>
                ))}
              </div>
            </div>

            <button onClick={exportAnalysisCSV} className="w-full py-3 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-colors">
              Export Keywords
            </button>
          </div>
        )}
      </div>

      {/* RESULTS GRID */}
      {result && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-black italic tracking-tighter">Scanned <span className="text-orange-500">Results</span></h2>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{result.tokens_found} Tokens Detected</span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {result.scored_tokens.map((token) => (
              <div key={token.rank} className="bg-slate-900/40 border border-white/10 rounded-3xl p-6 hover:border-white/20 transition-all">
                <div className="flex justify-between items-start mb-4">
                  <span className="text-xs font-black text-slate-600">RANK #{token.rank}</span>
                  <span className={`text-xl font-black ${token.score >= 8 ? 'text-green-500' : token.score >= 5 ? 'text-yellow-500' : 'text-slate-500'}`}>
                    {token.score}/10
                  </span>
                </div>
                <h3 className="text-xl font-black text-white mb-2 uppercase tracking-tighter">{token.name}</h3>
                <p className="text-slate-400 text-[11px] font-medium leading-relaxed">{token.reason}</p>
                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-1000 ${token.score >= 8 ? 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-orange-500'}`}
                    style={{ width: `${token.score * 10}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
