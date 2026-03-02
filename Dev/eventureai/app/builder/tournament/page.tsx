"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, Zap, Trophy, MessageSquare, Clock, ArrowRight, Activity, Plus } from "lucide-react";
import { IOSCard, IOSPrimaryButton } from "@/src/components/ds/index.js";
import MarketingHeader from "@/src/components/Marketing/MarketingHeader";

interface Response {
  model: string;
  content: string;
  duration: number;
  status: 'success' | 'error';
}

const MODELS = [
  { id: 'claude-3-5-sonnet-20240620', name: 'Claude 3.5 Sonnet', provider: 'Anthropic' },
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI' },
  { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google' },
  { id: 'llama-3.1-405b', name: 'Llama 3.1 405B', provider: 'Meta' }
];

export default function TournamentPage() {
  const [prompt, setPrompt] = useState("");
  const [selectedModels, setSelectedModels] = useState<string[]>(['claude-3-5-sonnet-20240620', 'gpt-4o']);
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<Response[] | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const startTournament = async () => {
    if (!prompt || selectedModels.length === 0) return;
    setIsRunning(true);
    setResults(null);

    try {
      const response = await fetch('/api/builder/tournament', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, models: selectedModels })
      });

      const data = await response.json();
      if (data.responses) {
        setResults(data.responses);
      }
    } catch (err) {
      console.error("Tournament failed", err);
    } finally {
      setIsRunning(false);
    }
  };

  const toggleModel = (id: string) => {
    setSelectedModels(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen bg-[#F2F2F7] text-black">
      <MarketingHeader />
      
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <a href="/builder/agent" className="flex items-center gap-2 text-blue-500 font-semibold mb-2 hover:underline">
              <ChevronLeft size={16} />
              Back to Builder
            </a>
            <h1 className="text-4xl font-black tracking-tight uppercase">LLM Tournament</h1>
            <p className="text-black/50 font-medium">Competition-based response generation & analysis.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-all ${isRunning ? 'bg-emerald-500 border-emerald-500 text-white animate-pulse' : 'bg-white border-black/10 text-black/40'}`}>
              {isRunning ? 'Tournament in Progress' : 'System Ready'}
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Input Panel */}
          <div className="lg:col-span-1 space-y-6">
            <IOSCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-black text-white rounded-md flex items-center justify-center font-mono text-[10px] font-bold">01</div>
                <h2 className="font-bold text-lg uppercase tracking-tight">Configuration</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-bold text-black/40 uppercase tracking-widest mb-2">Target Models</label>
                  <div className="space-y-2">
                    {MODELS.map(m => (
                      <button 
                        key={m.id}
                        onClick={() => toggleModel(m.id)}
                        className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${selectedModels.includes(m.id) ? 'bg-blue-50 border-blue-500 text-blue-700' : 'bg-white border-black/5 hover:border-black/10'}`}
                      >
                        <div>
                          <div className="font-bold text-sm">{m.name}</div>
                          <div className="text-[10px] opacity-60 uppercase tracking-wider">{m.provider}</div>
                        </div>
                        {selectedModels.includes(m.id) && <Zap size={14} className="fill-current" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-black/5">
                  <label className="block text-[10px] font-bold text-black/40 uppercase tracking-widest mb-2">Debate Mode</label>
                  <div className="flex items-center gap-2 p-3 bg-black/5 rounded-2xl opacity-50 cursor-not-allowed">
                    <div className="w-4 h-4 rounded-full border border-black/20" />
                    <span className="text-xs font-semibold">Recursive Consensus (v3.0)</span>
                  </div>
                </div>
              </div>
            </IOSCard>
          </div>

          {/* Prompt & Results Panel */}
          <div className="lg:col-span-2 space-y-6">
            <IOSCard className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-black text-white rounded-md flex items-center justify-center font-mono text-[10px] font-bold">02</div>
                <h2 className="font-bold text-lg uppercase tracking-tight">The Challenge</h2>
              </div>
              <textarea 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Enter a technical prompt or engineering task for the models to compete on..."
                className="w-full h-40 p-6 bg-[#F2F2F7] rounded-3xl outline-none focus:ring-2 ring-blue-500/20 font-medium text-lg resize-none placeholder:text-black/20 transition-all"
              />
              <div className="mt-6 flex justify-end">
                <button 
                  onClick={startTournament}
                  disabled={isRunning || !prompt || selectedModels.length === 0}
                  className="px-10 py-5 bg-black text-white rounded-full font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 disabled:bg-black/10 disabled:text-black/30 transition-all flex items-center gap-3 active:scale-95"
                >
                  {isRunning ? 'Compiling Responses...' : 'Launch Tournament'}
                  <Zap size={16} />
                </button>
              </div>
            </IOSCard>

            {/* Results Display */}
            {results && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                <div className="flex items-center gap-4 px-2">
                  {results.map((r, idx) => (
                    <button 
                      key={idx}
                      onClick={() => setActiveTab(idx)}
                      className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === idx ? 'bg-black text-white' : 'bg-white text-black/40 border border-black/5'}`}
                    >
                      {r.model.split('-')[0]}
                    </button>
                  ))}
                </div>

                <IOSCard className="overflow-hidden">
                  <div className="p-6 border-b border-black/5 bg-black/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Trophy size={18} className="text-amber-500" />
                      <span className="font-bold uppercase tracking-tight">{results[activeTab].model}</span>
                    </div>
                    <div className="flex items-center gap-4 font-mono text-[10px] text-black/40">
                      <span className="flex items-center gap-1"><Clock size={10} /> {results[activeTab].duration}ms</span>
                      <span className="flex items-center gap-1 uppercase tracking-widest text-emerald-600"><Zap size={10} className="fill-current" /> Validated</span>
                    </div>
                  </div>
                  <div className="p-8">
                    <pre className="whitespace-pre-wrap font-mono text-sm leading-relaxed text-black/70">
                      {results[activeTab].content}
                    </pre>
                  </div>
                </IOSCard>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
