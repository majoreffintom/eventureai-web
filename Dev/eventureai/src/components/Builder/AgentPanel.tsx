'use client';

import { useState } from 'react';
import {
  Hammer,
  Bug,
  Rocket,
  Trophy,
  Brain,
  ChevronRight,
  Circle,
  Loader2
} from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  type: 'build' | 'dev' | 'live';
  status: 'idle' | 'thinking' | 'building' | 'debugging' | 'deploying';
}

const AGENTS: Agent[] = [
  { id: 'build', name: 'Builder', type: 'build', status: 'idle' },
  { id: 'dev', name: 'Debugger', type: 'dev', status: 'idle' },
  { id: 'live', name: 'Live Monitor', type: 'live', status: 'idle' },
];

const STATUS_COLORS = {
  idle: 'bg-gray-400',
  thinking: 'bg-yellow-500 animate-pulse',
  building: 'bg-blue-500 animate-pulse',
  debugging: 'bg-orange-500 animate-pulse',
  deploying: 'bg-green-500 animate-pulse',
};

const AGENT_ICONS = {
  build: Hammer,
  dev: Bug,
  live: Rocket,
};

interface AgentPanelProps {
  selectedAgent: string;
  onSelectAgent: (id: string) => void;
  memoryCount: number;
  tournamentStatus: 'idle' | 'ready' | 'running';
}

export default function AgentPanel({ selectedAgent, onSelectAgent, memoryCount, tournamentStatus }: AgentPanelProps) {
  const [expanded, setExpanded] = useState({ agents: true, tournament: true, memory: true });

  return (
    <div className="p-3 space-y-4">
      {/* Agents Section */}
      <div>
        <button
          onClick={() => setExpanded(e => ({ ...e, agents: !e.agents }))}
          className="flex items-center justify-between w-full text-[10px] font-bold text-black/40 uppercase tracking-widest px-2 py-1"
        >
          <span>Agents</span>
          <ChevronRight size={12} className={`transition-transform ${expanded.agents ? 'rotate-90' : ''}`} />
        </button>
        {expanded.agents && (
          <nav className="mt-1 space-y-0.5">
            {AGENTS.map((agent) => {
              const Icon = AGENT_ICONS[agent.type];
              const isSelected = selectedAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => onSelectAgent(agent.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                    isSelected ? 'bg-white shadow-sm text-blue-500 font-semibold' : 'text-black/60 hover:bg-black/5'
                  }`}
                >
                  <Icon size={18} />
                  <span className="flex-1 text-left text-sm">{agent.name}</span>
                  <Circle size={8} className={`${STATUS_COLORS[agent.status]}`} />
                </button>
              );
            })}
          </nav>
        )}
      </div>

      {/* Tournament Section */}
      <div>
        <button
          onClick={() => setExpanded(e => ({ ...e, tournament: !e.tournament }))}
          className="flex items-center justify-between w-full text-[10px] font-bold text-black/40 uppercase tracking-widest px-2 py-1"
        >
          <span>Tournament</span>
          <ChevronRight size={12} className={`transition-transform ${expanded.tournament ? 'rotate-90' : ''}`} />
        </button>
        {expanded.tournament && (
          <div className="mt-1 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Trophy size={16} className={tournamentStatus === 'running' ? 'text-yellow-500' : 'text-black/40'} />
              <span className="text-sm text-black/60">
                {tournamentStatus === 'running' ? 'Running...' : tournamentStatus === 'ready' ? 'Ready' : 'No active tournament'}
              </span>
              {tournamentStatus === 'running' && <Loader2 size={14} className="animate-spin text-blue-500" />}
            </div>
          </div>
        )}
      </div>

      {/* Memory Section */}
      <div>
        <button
          onClick={() => setExpanded(e => ({ ...e, memory: !e.memory }))}
          className="flex items-center justify-between w-full text-[10px] font-bold text-black/40 uppercase tracking-widest px-2 py-1"
        >
          <span>Memory</span>
          <ChevronRight size={12} className={`transition-transform ${expanded.memory ? 'rotate-90' : ''}`} />
        </button>
        {expanded.memory && (
          <div className="mt-1 px-3 py-2.5">
            <div className="flex items-center gap-2">
              <Brain size={16} className="text-purple-500" />
              <span className="text-sm text-black/60">{memoryCount.toLocaleString()} memories</span>
            </div>
            <input
              type="text"
              placeholder="Search memories..."
              className="mt-2 w-full text-sm bg-black/5 rounded-lg px-3 py-2 outline-none focus:bg-white transition-colors"
            />
          </div>
        )}
      </div>
    </div>
  );
}
