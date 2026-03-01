"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { 
  ArrowRight, 
  Wand2, 
  Monitor, 
  Layout, 
  Zap, 
  Globe, 
  Cpu, 
  Utensils, 
  Smartphone, 
  Box, 
  Sparkles, 
  Sun, 
  Hammer,
  Database,
  Layers,
  MessageSquare,
  Ticket,
  Image as ImageIcon
} from "lucide-react";

const ecosystemApps = [
  { name: "SwarMCP.com", description: "The flagship app builder. Visual logic & AI swarm orchestration.", icon: Zap, href: "https://swarmcp.com" },
  { name: "Heymori.com", description: "Autonomous CRM & personal assistant. Your AI-driven memory engine.", icon: Database, href: "https://heymori.com" },
  { name: "Ditzl.com", description: "Next-gen ticketing & event management. Secure, social, and seamless.", icon: Ticket, href: "https://ditzl.com" },
  { name: "StreetEatsMap.com", description: "Autonomous logistics & real-time mapping for food truck vendors.", icon: Utensils, href: "https://streeteatsmap.com" },
  { name: "BeTheFirstNFT.com", description: "Web3 minting vehicle. Integrated NFT art for digital tickets.", icon: ImageIcon, href: "https://bethefirstnft.com" },
  { name: "Peggy.com", description: "Next-gen personal finance & automated accounting on the stack.", icon: Smartphone, href: "#" },
  { name: "Lumina.ai", description: "AI-driven visual design & asset generation for all tenants.", icon: Sun, href: "#" },
  { name: "Contractor OS", description: "The integrated OS for HVAC, Electric, & Plumbing contractors.", icon: Hammer, href: "#" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white text-black font-sans selection:bg-black selection:text-white">
      {/* Header */}
      <nav className="fixed top-0 w-full z-50 px-6 py-6 md:px-12 flex justify-between items-end border-b border-zinc-100 bg-white/80 backdrop-blur-sm">
        <div className="flex flex-col">
          <span className="text-2xl font-bold tracking-tighter leading-none">EVENTUREAI</span>
          <span className="text-[10px] uppercase tracking-widest font-medium text-zinc-400 mt-1">EST. 2024 / THE STUDIO</span>
        </div>
        <div className="flex gap-8 text-sm font-medium">
          <a href="#demo" className="hover:text-zinc-500 transition-colors">DEMO</a>
          <a href="#ecosystem" className="hover:text-zinc-500 transition-colors">ECOSYSTEM</a>
          <Link href="/billing" className="hover:text-zinc-500 transition-colors">BILLING</Link>
          <Link href="/builder" className="hover:text-zinc-500 transition-colors">BUILDER</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-48 pb-24 px-6 md:px-12 max-w-7xl mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-12"
        >
          <div>
            <h1 className="text-7xl md:text-9xl font-bold tracking-tighter leading-[0.85] mb-8">
              BUILD<br />THINGS<br />BETTER.
            </h1>
            <p className="text-xl md:text-2xl font-normal text-zinc-500 max-w-md leading-tight mb-12">
              EventureAI is a venture studio for the autonomous era. We build integrated SaaS modules powered by the webMCP engine.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                href="/builder"
                className="inline-flex items-center justify-center px-8 py-4 bg-black text-white text-sm font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all group"
              >
                Launch SwarMCP
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </Link>
              <a 
                href="#demo"
                className="inline-flex items-center justify-center px-8 py-4 border border-zinc-200 text-sm font-bold uppercase tracking-widest hover:bg-zinc-50 transition-all"
              >
                Explore Stack
              </a>
            </div>
          </div>
          <div className="flex flex-col justify-end items-end text-right">
            <div className="p-8 border border-zinc-100 rounded-3xl w-full aspect-square bg-zinc-50 relative overflow-hidden group">
               <div className="absolute inset-0 bg-grid-zinc-200/50 [mask-image:linear-gradient(to_bottom,white,transparent)]" />
               <motion.div 
                 initial={{ scale: 0.95, opacity: 0 }}
                 animate={{ scale: 1, opacity: 1 }}
                 transition={{ delay: 0.4, duration: 1 }}
                 className="relative z-10 w-full h-full border border-zinc-200 bg-white rounded-xl shadow-2xl flex flex-col p-4 overflow-hidden"
               >
                 <div className="flex items-center gap-2 mb-4 border-b border-zinc-100 pb-2">
                   <div className="w-3 h-3 rounded-full bg-zinc-100" />
                   <div className="w-3 h-3 rounded-full bg-zinc-100" />
                   <div className="w-3 h-3 rounded-full bg-zinc-100" />
                   <div className="ml-auto text-[10px] text-zinc-400 font-mono tracking-tighter uppercase">SWARMCP_SYSTEM</div>
                 </div>
                 <div className="flex-1 flex flex-col justify-center items-center gap-4 text-center">
                    <div className="w-12 h-12 bg-black text-white rounded-lg flex items-center justify-center mb-2">
                       <Zap size={24} />
                    </div>
                    <div className="h-4 w-32 bg-zinc-100 rounded" />
                    <div className="h-4 w-48 bg-zinc-50 rounded" />
                    <div className="h-10 w-40 border border-zinc-100 rounded mt-4" />
                 </div>
               </motion.div>
            </div>
            <div className="mt-8">
               <span className="text-xs uppercase tracking-[0.2em] font-bold text-zinc-300">Proprietary Stack / v1.0.4</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Demo Section */}
      <section id="demo" className="py-24 px-6 md:px-12 border-t border-zinc-100 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-24 gap-8">
            <div className="max-w-xl">
              <h2 className="text-4xl font-bold tracking-tighter mb-4 uppercase">The Core Engine.</h2>
              <p className="text-lg text-zinc-500 leading-snug">
                Every tenant in our ecosystem is built using **SwarMCP**. It’s the visual builder, AI orchestrator, and deployment engine that drives our growth.
              </p>
            </div>
            <div className="flex gap-4">
               <div className="p-4 bg-white border border-zinc-100 flex flex-col gap-1 w-32">
                  <span className="text-[10px] font-bold text-zinc-400">NODES</span>
                  <span className="text-xl font-bold tracking-tighter">1,200+</span>
               </div>
               <div className="p-4 bg-white border border-zinc-100 flex flex-col gap-1 w-32">
                  <span className="text-[10px] font-bold text-zinc-400">TENANTS</span>
                  <span className="text-xl font-bold tracking-tighter">8+</span>
               </div>
            </div>
          </div>

          <div className="relative border border-zinc-200 bg-white rounded-2xl overflow-hidden shadow-2xl aspect-[16/10] group">
            <div className="absolute top-0 w-full h-12 bg-zinc-50 border-b border-zinc-100 flex items-center px-4 gap-4 z-20">
               <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
                  <div className="w-2.5 h-2.5 rounded-full bg-zinc-200" />
               </div>
               <div className="bg-white border border-zinc-200 rounded px-3 py-1 text-[10px] text-zinc-400 font-mono flex-1 max-w-xs truncate">
                  builder.swarmcp.com/project-delta
               </div>
            </div>
            
            {/* Visual Demo Elements */}
            <div className="pt-12 h-full flex overflow-hidden">
               <div className="w-48 border-r border-zinc-100 p-4 flex flex-col gap-4">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="h-10 w-full bg-zinc-50 rounded animate-pulse" style={{ animationDelay: `${i * 100}ms` }} />
                  ))}
               </div>
               <div className="flex-1 bg-zinc-100/30 relative p-8">
                  <motion.div 
                    animate={{ x: [0, 20, 0], y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
                    className="w-64 h-80 bg-white border border-zinc-200 shadow-sm rounded-lg p-6 flex flex-col gap-4 mx-auto"
                  >
                     <div className="h-8 w-8 bg-black rounded" />
                     <div className="h-4 w-3/4 bg-zinc-100 rounded" />
                     <div className="h-4 w-full bg-zinc-50 rounded" />
                     <div className="h-4 w-full bg-zinc-50 rounded" />
                     <div className="h-24 w-full bg-zinc-50 rounded mt-auto" />
                  </motion.div>
               </div>
               <div className="w-64 border-l border-zinc-100 p-4 bg-white hidden lg:block">
                  <div className="text-[10px] font-bold text-zinc-300 mb-4 tracking-widest uppercase">PROPERTIES</div>
                  <div className="flex flex-col gap-6">
                     {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2">
                           <div className="h-2 w-16 bg-zinc-100 rounded" />
                           <div className="h-8 w-full border border-zinc-100 rounded" />
                        </div>
                     ))}
                  </div>
               </div>
            </div>
          </div>
        </div>
      </section>

      {/* Ecosystem Section */}
      <section id="ecosystem" className="py-24 px-6 md:px-12 border-t border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col mb-16">
            <h2 className="text-4xl font-bold tracking-tighter mb-4 uppercase">The Venture Stack.</h2>
            <p className="text-lg text-zinc-500 leading-snug max-w-2xl">
              EventureAI powers a specialized fleet of autonomous SaaS applications. 
              Integrated via the **webMCP Engine** and deployed instantly.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-zinc-100 border border-zinc-100">
            {ecosystemApps.map((app, i) => (
              <motion.div 
                key={app.name}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                viewport={{ once: true }}
                className="bg-white p-8 group hover:bg-zinc-50 transition-colors flex flex-col"
              >
                <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <app.icon size={20} />
                </div>
                <h3 className="text-sm font-bold uppercase tracking-widest mb-2">{app.name}</h3>
                <p className="text-xs text-zinc-400 leading-relaxed font-medium mb-6 flex-1">
                  {app.description}
                </p>
                <a 
                  href={app.href} 
                  target="_blank" 
                  className="text-[10px] font-bold uppercase tracking-widest text-zinc-300 group-hover:text-black transition-colors flex items-center gap-2"
                >
                  Visit App <ArrowRight size={10} />
                </a>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 flex justify-between items-center py-8 border-t border-zinc-100">
             <div className="flex items-center gap-2">
                <Layers className="text-zinc-200" size={16} />
                <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-widest">Powered by webMCP v4.0.1</span>
             </div>
             <Link href="/builder" className="text-[10px] font-bold uppercase tracking-widest hover:text-zinc-400 transition-colors flex items-center gap-2">
                Launch SwarMCP <ArrowRight size={12} />
             </Link>
          </div>
        </div>
      </section>

      {/* Featured: Heymori Section */}
      <section className="py-24 px-6 md:px-12 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-24 items-center">
          <div className="relative">
            <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 blur-3xl rounded-full" />
            <div className="relative z-10">
              <span className="inline-block px-3 py-1 bg-white/10 text-[10px] font-bold tracking-widest uppercase mb-6">FEATURED TENANT</span>
              <h2 className="text-6xl font-bold tracking-tighter mb-8 leading-[0.9]">HEYMORI.COM</h2>
              <p className="text-xl text-zinc-400 leading-snug mb-12 max-w-md">
                Experience the power of our stack through Heymori, a fully autonomous personal assistant and CRM built entirely with SwarMCP.
              </p>
              <a 
                href="https://heymori.com" 
                target="_blank"
                className="inline-flex items-center text-sm font-bold uppercase tracking-widest group"
              >
                Explore Heymori
                <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" size={18} />
              </a>
            </div>
          </div>
          <div className="relative aspect-square border border-white/10 rounded-full flex items-center justify-center p-12">
             <div className="absolute inset-0 border border-white/5 rounded-full scale-110 animate-pulse" />
             <div className="absolute inset-0 border border-white/5 rounded-full scale-125 opacity-50" />
             <div className="w-full h-full bg-zinc-900 border border-white/20 rounded-2xl flex flex-col p-6 shadow-2xl relative z-10">
                <div className="flex items-center gap-3 mb-6">
                   <div className="w-8 h-8 rounded-full bg-white" />
                   <div className="flex flex-col">
                      <span className="text-xs font-bold leading-none">MORI_AI</span>
                      <span className="text-[8px] text-zinc-500 uppercase tracking-widest mt-0.5">ONLINE</span>
                   </div>
                </div>
                <div className="flex-1 flex flex-col gap-4">
                   <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-400 max-w-[80%]">
                      How can I help you today?
                   </div>
                   <div className="p-3 bg-white text-black rounded-lg text-sm font-medium self-end max-w-[80%]">
                      Optimize my workflow.
                   </div>
                   <div className="p-3 bg-white/5 border border-white/10 rounded-lg text-sm text-zinc-400 max-w-[80%]">
                      Analyzing... Swarm agents deployed to 4 nodes. Optimizing latency.
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Free App CTA */}
      <section className="py-48 px-6 md:px-12 text-center max-w-4xl mx-auto">
        <h2 className="text-5xl md:text-8xl font-bold tracking-tighter mb-12 leading-[0.85] uppercase">
          Build for free.<br />Stay for the future.
        </h2>
        <div className="flex flex-col items-center gap-6">
          <Link 
            href="/builder"
            className="px-12 py-6 bg-black text-white text-lg font-bold uppercase tracking-widest hover:bg-zinc-800 transition-all flex items-center"
          >
            Start Building
            <Zap className="ml-3 fill-white" size={20} />
          </Link>
          <p className="text-sm text-zinc-400 tracking-widest uppercase">No credit card required / Free subdomain included</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-24 px-6 md:px-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-start gap-12">
        <div className="flex flex-col">
          <span className="text-xl font-bold tracking-tighter">EVENTUREAI</span>
          <span className="text-[10px] text-zinc-400 mt-2 uppercase tracking-[0.2em] font-medium">© 2024 EventureAI Corporation. All rights reserved.</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-12 text-xs font-bold tracking-widest uppercase">
          <div className="flex flex-col gap-4">
            <span className="text-zinc-300">CORE MODULES</span>
            <a href="https://swarmcp.com" className="hover:text-zinc-500">SwarMCP</a>
            <a href="https://heymori.com" className="hover:text-zinc-500">Heymori</a>
            <a href="https://ditzl.com" className="hover:text-zinc-500">Ditzl</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-zinc-300">RESOURCES</span>
            <a href="#" className="hover:text-zinc-500">Docs</a>
            <a href="#" className="hover:text-zinc-500">Guides</a>
          </div>
          <div className="flex flex-col gap-4">
            <span className="text-zinc-300">CORPORATE</span>
            <a href="#" className="hover:text-zinc-500">Privacy</a>
            <a href="#" className="hover:text-zinc-500">Terms</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
