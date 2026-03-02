"use client";

import { useState, useEffect } from "react";
import { ArrowUpRight, ChevronLeft, ArrowRight, Activity, Database, Zap, Cpu } from "lucide-react";

const SERVICES = [
  {
    num: "01",
    name: "Blockchain",
    desc: "Decentralized solutions, smart contracts, and Web3 infrastructure built for enterprise scale. We architect the trust layer for your next-generation applications.",
  },
  {
    num: "02",
    name: "Finance",
    desc: "Fintech platforms, payment processing, and financial modeling. Intelligent automation that turns complex financial workflows into competitive advantages.",
  },
  {
    num: "03",
    name: "Integration",
    desc: "Seamless API orchestration connecting every system in your stack. We eliminate silos and create unified data flows across your entire organization.",
  },
  {
    num: "04",
    name: "Memory",
    desc: "Persistent AI memory layers that learn, adapt, and evolve. Your AI doesn't just respond — it remembers, contextualizes, and anticipates.",
  },
  {
    num: "05",
    name: "Full Stack Web Dev",
    desc: "End-to-end web applications built with modern frameworks. From concept to deployment, we ship production-grade software that scales.",
  },
  {
    num: "06",
    name: "SEO",
    desc: "Data-driven search optimization that compounds over time. We don't chase algorithms — we build organic authority that lasts.",
  },
  {
    num: "07",
    name: "Marketing",
    desc: "AI-enhanced marketing strategies that convert attention into measurable, repeatable growth across every channel that matters.",
  },
  {
    num: "08",
    name: "Business Consulting",
    desc: "Strategic advisory that bridges the gap between technology capability and business transformation. We see the whole picture.",
  },
];

export default function SwissHomepage() {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);
  const [stats, setStats] = useState({ memories: 2847, tournaments: 142, activeSwarms: 8 });

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-[#111] font-sans selection:bg-black selection:text-white">
      {/* Structural Grid Lines - The Swiss Foundation */}
      <div className="fixed inset-0 pointer-events-none z-50">
        <div className="h-full w-full max-w-[1440px] mx-auto border-x border-black/[0.04] flex justify-between">
          <div className="w-px h-full bg-black/[0.04]" />
          <div className="w-px h-full bg-black/[0.04] hidden md:block" />
          <div className="w-px h-full bg-black/[0.04] hidden md:block" />
        </div>
      </div>

      {/* Header / Nav */}
      <nav className="relative border-b border-black flex items-stretch">
        <div className="flex-1 px-6 sm:px-12 py-8 border-r border-black/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="font-mono text-[10px] tracking-[0.2em] uppercase font-bold text-black/40">
              Infrastructure Status: Live
            </span>
          </div>
        </div>
        
        <div className="px-6 sm:px-12 py-8 flex items-center justify-between gap-12 flex-[2]">
          <div className="font-black text-2xl tracking-tighter uppercase leading-none">
            EventureAI
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="/builder" className="text-xs font-bold uppercase tracking-widest hover:text-emerald-600 transition-colors">Builder</a>
            <a href="/dashboard" className="text-xs font-bold uppercase tracking-widest hover:text-emerald-600 transition-colors">Dashboard</a>
            <a href="#contact" className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors">
              Contact
            </a>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative border-b border-black">
        <div className="px-6 sm:px-12 py-24 sm:py-40 lg:py-56 max-w-[1440px] mx-auto">
          <div className="font-mono text-xs mb-8 flex items-center gap-4">
            <span className="bg-black text-white px-2 py-1 font-bold">01</span>
            <span className="tracking-[0.3em] uppercase text-black/30">Architecture & Infrastructure</span>
          </div>
          <h1 className="font-black text-[clamp(2.5rem,10vw,9rem)] leading-[0.85] tracking-tighter uppercase text-[#111]">
            We build the
            <br />
            infrastructure
            <br />
            behind <span className="text-black/10">ambitious</span>
            <br />
            <span className="text-emerald-600">companies.</span>
          </h1>
          
          <div className="mt-20 grid grid-cols-1 md:grid-cols-3 gap-12 border-t border-black/[0.08] pt-12">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Database size={16} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Memory Layer</span>
              </div>
              <p className="text-sm text-black/50 leading-relaxed max-w-xs font-medium">
                Persistent AI contexts that learn and adapt with every interaction.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Zap size={16} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">Swarm Systems</span>
              </div>
              <p className="text-sm text-black/50 leading-relaxed max-w-xs font-medium">
                Orchestrated agent collectives designed for complex engineering tasks.
              </p>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-emerald-600">
                <Cpu size={16} />
                <span className="font-mono text-[10px] font-bold uppercase tracking-widest">WebMCP Protocol</span>
              </div>
              <p className="text-sm text-black/50 leading-relaxed max-w-xs font-medium">
                The standard for inter-agent communication and state management.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Verticals / Services Grid */}
      <section className="border-b border-black bg-white">
        <div className="grid grid-cols-1 lg:grid-cols-4 min-h-[600px]">
          {/* Sidebar / Label */}
          <div className="lg:border-r border-black p-6 sm:p-12 flex flex-col justify-between">
            <div>
              <div className="font-mono text-xs mb-8 flex items-center gap-4">
                <span className="bg-black text-white px-2 py-1 font-bold">02</span>
                <span className="tracking-[0.3em] uppercase text-black/30">Verticals</span>
              </div>
              <h2 className="text-5xl font-black uppercase tracking-tighter leading-none mb-6">
                Specialized
                <br />
                Sectors
              </h2>
            </div>
            <p className="text-xs text-black/40 font-mono leading-relaxed">
              EventureAI powers infrastructure across eight critical business verticals.
            </p>
          </div>

          {/* Vertical List - Full Swiss Brutalist */}
          <div className="lg:col-span-3 divide-y divide-black">
            {SERVICES.map((s, i) => {
              const isExpanded = expandedIdx === i;
              return (
                <div 
                  key={s.num} 
                  className={`group cursor-pointer transition-colors duration-500 ${isExpanded ? 'bg-emerald-50' : 'hover:bg-black hover:text-white'}`}
                  onClick={() => setExpandedIdx(isExpanded ? null : i)}
                >
                  <div className="px-6 sm:px-12 py-10 flex items-center justify-between gap-8">
                    <div className="flex items-baseline gap-12">
                      <span className={`font-mono text-xs ${isExpanded ? 'text-emerald-600' : 'text-black/20 group-hover:text-white/40'}`}>
                        {s.num}
                      </span>
                      <h3 className="text-3xl sm:text-5xl font-black uppercase tracking-tighter">
                        {s.name}
                      </h3>
                    </div>
                    <div className={`w-12 h-12 border flex items-center justify-center transition-all duration-500 ${isExpanded ? 'border-emerald-500 bg-emerald-500 text-white rotate-90' : 'border-black/10 group-hover:border-white/40'}`}>
                      <ArrowRight size={20} />
                    </div>
                  </div>
                  
                  <div className={`overflow-hidden transition-all duration-500 ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                    <div className="px-6 sm:px-12 pb-12 pt-4">
                      <p className="text-xl sm:text-2xl text-black/60 leading-tight max-w-3xl font-medium">
                        {s.desc}
                      </p>
                      <button className="mt-8 px-6 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-colors">
                        Launch Project
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Real-time Stats / Footer Stats */}
      <section className="border-b border-black">
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black">
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="font-black text-8xl tracking-tighter">{stats.memories}</div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black/30">Memories Indexed</div>
          </div>
          <div className="p-12 flex flex-col items-center justify-center gap-4 bg-black text-white">
            <div className="font-black text-8xl tracking-tighter text-emerald-500">{stats.tournaments}</div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-white/30">Active Tournaments</div>
          </div>
          <div className="p-12 flex flex-col items-center justify-center gap-4">
            <div className="font-black text-8xl tracking-tighter">{stats.activeSwarms}</div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.3em] text-black/30">Live Swarms</div>
          </div>
        </div>
      </section>

      {/* Quote / Manifesto */}
      <section className="px-6 sm:px-12 py-32 sm:py-48 max-w-[1440px] mx-auto text-center border-b border-black">
        <div className="font-mono text-[10px] mb-8 uppercase tracking-[0.5em] text-black/20 font-bold italic">
          — Operational Philosophy
        </div>
        <blockquote className="text-4xl sm:text-7xl font-black uppercase tracking-tighter leading-[0.9] max-w-5xl mx-auto">
          "Architecture is the <span className="text-emerald-600">ultimate</span> form of <span className="text-black/15">optimization."</span>
        </blockquote>
      </section>

      {/* Contact / Action */}
      <footer id="contact" className="p-6 sm:p-12">
        <div className="flex flex-col md:flex-row justify-between items-start gap-12">
          <div className="space-y-6">
            <div className="font-black text-3xl uppercase tracking-tighter">EventureAI</div>
            <div className="text-sm font-mono text-black/40">
              Copenhagen / San Francisco / Decentralized
            </div>
          </div>
          <div className="flex flex-col items-end gap-6 w-full md:w-auto">
            <a 
              href="mailto:hello@eventureai.com" 
              className="text-2xl sm:text-5xl font-black uppercase tracking-tighter hover:text-emerald-600 transition-colors border-b-4 border-black pb-2"
            >
              hello@eventureai.com
            </a>
            <div className="flex items-center gap-8 font-mono text-[10px] font-bold uppercase tracking-widest text-black/30">
              <a href="#" className="hover:text-black transition-colors">Privacy</a>
              <a href="#" className="hover:text-black transition-colors">Terms</a>
              <a href="#" className="hover:text-black transition-colors">v2.1.0</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
      `}</style>
    </div>
  );
}
