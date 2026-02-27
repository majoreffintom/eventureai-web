'use client';

import { ReactNode } from 'react';

interface BuilderLayoutProps {
  agentPanel: ReactNode;
  chatPanel: ReactNode;
  previewPanel: ReactNode;
}

export default function BuilderLayout({ agentPanel, chatPanel, previewPanel }: BuilderLayoutProps) {
  return (
    <div className="h-screen flex flex-col bg-[#F2F2F7]">
      {/* Top Bar */}
      <header className="h-14 px-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg">EventureAI Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm bg-black/5 rounded-lg px-3 py-1.5 outline-none">
            <option>Claude Opus 4</option>
            <option>Claude Sonnet 4</option>
            <option>GPT-4o</option>
            <option>Gemini Pro</option>
          </select>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            U
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Agent Sidebar */}
        <aside className="w-60 border-r border-black/5 bg-white/50 overflow-y-auto">
          {agentPanel}
        </aside>

        {/* Chat Panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {chatPanel}
        </main>

        {/* Preview Panel */}
        <aside className="w-[400px] border-l border-black/5 bg-white/50 overflow-hidden">
          {previewPanel}
        </aside>
      </div>
    </div>
  );
}
