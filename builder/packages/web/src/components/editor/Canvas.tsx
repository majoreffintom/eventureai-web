"use client";

import { useDroppable } from "@dnd-kit/core";
import { Plus, Play, ExternalLink, Rocket, Loader2 } from "lucide-react";
import { useState } from "react";
import { useEditorStore } from "@/store/editorStore";
import { ComponentRenderer } from "./ComponentRenderer";

export function Canvas() {
  const { elements, selectedElementId, selectElement } = useEditorStore();
  const [isPublishing, setIsPublishing] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const { setNodeRef, isOver } = useDroppable({
    id: "canvas-root",
  });

  const handlePublish = async (env: 'dev' | 'live') => {
    if (env === 'live' && !subdomain) {
      alert("Please enter a subdomain to go live.");
      return;
    }
    setIsPublishing(true);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ elements, env, subdomain }),
      });
      
      if (!response.ok) throw new Error("Failed to publish");
      
      const result = await response.json();
      const url = env === 'live' ? `${subdomain}.eventureai.com` : 'Preview synced';
      alert(`Published! ${env === 'live' ? `Your app is live at: ${url}` : 'Preview updated.'}`);
    } catch (error) {
      console.error(error);
      alert("Error publishing app.");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex-1 bg-zinc-50 flex flex-col relative overflow-hidden">
      {/* Top Bar */}
      <div className="h-14 border-b border-zinc-100 flex items-center px-4 justify-between bg-white/80 backdrop-blur-sm z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Editing:</span>
          <span className="text-black text-xs font-bold uppercase tracking-tighter">Main Page</span>
        </div>
        <div className="flex items-center gap-3">
          <a 
            href="/preview?env=dev"
            target="_blank"
            className="p-1.5 text-zinc-400 hover:text-black transition-colors"
            title="View Preview"
          >
            <ExternalLink size={14} />
          </a>
          <button 
            onClick={() => handlePublish('dev')}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-zinc-500 bg-zinc-100 hover:bg-zinc-200 rounded transition-colors disabled:opacity-50"
          >
            {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            Sync Preview
          </button>
          <a 
            href="/preview?env=live"
            target="_blank"
            className="p-1.5 text-zinc-400 hover:text-black transition-colors"
            title="View Live"
          >
            <ExternalLink size={14} />
          </a>
          <div className="flex items-center bg-zinc-100 rounded px-2 border border-zinc-200">
            <input 
              type="text"
              placeholder="your-subdomain"
              value={subdomain}
              onChange={(e) => setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
              className="bg-transparent text-[10px] font-bold uppercase tracking-widest outline-none w-24 py-1"
            />
            <span className="text-[8px] text-zinc-400 font-bold">.EVENTUREAI.COM</span>
          </div>
          <button 
            onClick={() => handlePublish('live')}
            disabled={isPublishing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest bg-black hover:bg-zinc-800 text-white rounded transition-all active:scale-95 disabled:opacity-50"
          >
            {isPublishing ? <Loader2 size={14} className="animate-spin" /> : <Rocket size={14} />}
            Go Live
          </button>
        </div>
      </div>

      {/* Main Canvas Area */}
      <div 
        className="flex-1 p-8 overflow-auto flex flex-col"
        onClick={() => selectElement(null)}
      >
        <div 
          ref={setNodeRef}
          className={`min-h-full rounded-2xl border-2 transition-colors ${
            isOver ? "border-black bg-black/5" : "border-dashed border-zinc-200 bg-white"
          } ${elements.length === 0 ? "flex flex-col items-center justify-center text-zinc-400" : "p-8 max-w-4xl mx-auto w-full bg-white text-black shadow-xl rounded-xl border-zinc-100"}`}
        >
          {elements.length === 0 ? (
            <>
              <div className="w-16 h-16 rounded-2xl bg-zinc-50 flex items-center justify-center mb-4 text-zinc-300">
                <Plus size={32} />
              </div>
              <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-400 mb-2">Build Your Vision</h3>
              <p className="text-xs max-w-sm text-center text-zinc-300 tracking-tight leading-snug">
                Drag components here or ask the Swarm to build for you. 
                Everything you create is automatically synced across dev and live environments.
              </p>
            </>
          ) : (
            <div className="space-y-4">
              {elements.map(el => (
                <ComponentRenderer key={el.id} element={el} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
