# App Builder UI Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a multi-agent app builder interface with chat, preview, tournament support, and memory integration.

**Architecture:** Three-panel layout (Agent Sidebar, Chat Panel, Preview Panel) with real-time streaming via SSE, connecting to existing Neon database tables for tournaments, memories, and LLM tracking.

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS v4, React Query, Neon PostgreSQL, Server-Sent Events

---

## Phase 1: Foundation & Database Connection

### Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

**Step 1: Install Neon serverless driver and SSE dependencies**

```bash
cd "C:\data\projects\geometry_os\geometry_os\mori\apps\eventureai\Dev\eventureai"
npm install @neondatabase/serverless
```

**Step 2: Verify installation**

Run: `npm list @neondatabase/serverless`
Expected: `@neondatabase/serverless@x.x.x`

**Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore: add neon serverless driver"
```

---

### Task 2: Create Database Utility

**Files:**
- Create: `src/lib/db.ts`

**Step 1: Create database connection utility**

```typescript
// src/lib/db.ts
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

neonConfig.fetchConnectionCache = true;

const databaseUrl = process.env.DATABASE_URL!;

if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set');
}

export const sql = neon(databaseUrl);

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  return sql(text, params) as Promise<T[]>;
}

export default sql;
```

**Step 2: Create types file**

```typescript
// src/lib/db-types.ts
export interface Tenant {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  domain: string | null;
  is_active: boolean;
  config: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface App {
  id: number;
  title: string;
  summary: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface Workspace {
  id: number;
  user_id: number;
  title: string;
  summary: string | null;
  status: string;
  app_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface Memory {
  id: number;
  workspace_id: number | null;
  user_id: number | null;
  title: string | null;
  content: string | null;
  memory_type: string | null;
  tags: string[] | null;
  domain: string | null;
  summary: string | null;
  created_at: string;
  updated_at: string;
}

export interface LLMTournament {
  id: number;
  app_id: number | null;
  workspace_id: number | null;
  user_id: number | null;
  prompt: string | null;
  debate_mode: boolean;
  rounds: number;
  models_used: string[] | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface LLMResponse {
  id: number;
  tournament_id: number | null;
  model_key: string | null;
  model_provider: string | null;
  content: string | null;
  picked: boolean;
  interesting: boolean;
  created_at: string;
}

export interface MoriErrorChain {
  id: number;
  app_id: number | null;
  workspace_id: number | null;
  title: string | null;
  status: string | null;
  severity: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface MoriSolution {
  id: number;
  chain_id: number | null;
  root_cause: string | null;
  solution_text: string | null;
  prevention: string | null;
  created_at: string;
  updated_at: string;
  tags: string[] | null;
  category: string | null;
  verified: boolean | null;
}
```

**Step 3: Commit**

```bash
git add src/lib/db.ts src/lib/db-types.ts
git commit -m "feat: add database utility and types"
```

---

### Task 3: Create API Route for Database Health Check

**Files:**
- Create: `app/api/health/route.ts`

**Step 1: Create health check endpoint**

```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET() {
  try {
    const result = await sql`SELECT 1 as health`;
    return NextResponse.json({
      status: 'healthy',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      database: 'disconnected',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
```

**Step 2: Test the endpoint**

Run: `npm run dev`
Then visit: `http://localhost:3000/api/health`
Expected: `{"status":"healthy","database":"connected","timestamp":"..."}`

**Step 3: Commit**

```bash
git add app/api/health/route.ts
git commit -m "feat: add database health check endpoint"
```

---

## Phase 2: Builder Layout Components

### Task 4: Create Builder Layout Component

**Files:**
- Create: `src/components/Builder/BuilderLayout.tsx`

**Step 1: Create the main layout component**

```typescript
// src/components/Builder/BuilderLayout.tsx
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
```

**Step 2: Commit**

```bash
git add src/components/Builder/BuilderLayout.tsx
git commit -m "feat: add builder layout component"
```

---

### Task 5: Create Agent Panel Component

**Files:**
- Create: `src/components/Builder/AgentPanel.tsx`

**Step 1: Create the agent panel**

```typescript
// src/components/Builder/AgentPanel.tsx
'use client';

import { useState } from 'react';
import {
  Bot,
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
```

**Step 2: Commit**

```bash
git add src/components/Builder/AgentPanel.tsx
git commit -m "feat: add agent panel component"
```

---

### Task 6: Create Chat Panel Component

**Files:**
- Create: `src/components/Builder/ChatPanel.tsx`
- Create: `src/components/Builder/ChatMessage.tsx`

**Step 1: Create the chat message component**

```typescript
// src/components/Builder/ChatMessage.tsx
'use client';

import { User, Bot } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export default function ChatMessage({ role, content, timestamp, isStreaming }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''} p-4`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
        isUser ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
      }`}>
        {isUser ? <User size={16} /> : <Bot size={16} />}
      </div>
      <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
        <div className={`inline-block text-left p-3 rounded-2xl ${
          isUser ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'
        }`}>
          <div className="text-sm whitespace-pre-wrap">{content}</div>
          {isStreaming && (
            <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
          )}
        </div>
        <div className={`text-[10px] text-black/40 mt-1 ${isUser ? 'text-right' : ''}`}>
          {timestamp}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Create the chat panel component**

```typescript
// src/components/Builder/ChatPanel.tsx
'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, Paperclip } from 'lucide-react';
import ChatMessage from './ChatMessage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface ChatPanelProps {
  messages: Message[];
  onSendMessage: (content: string) => void;
  isLoading: boolean;
}

export default function ChatPanel({ messages, onSendMessage, isLoading }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isLoading) {
      onSendMessage(input.trim());
      setInput('');
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-black/40">
            <div className="text-center">
              <div className="text-4xl mb-2">👋</div>
              <p className="text-sm">Start a conversation with your AI agent</p>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              role={msg.role}
              content={msg.content}
              timestamp={msg.timestamp}
              isStreaming={msg.isStreaming}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-black/5 bg-white/50">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <button
            type="button"
            className="p-2 rounded-full hover:bg-black/5 transition-colors"
          >
            <Paperclip size={20} className="text-black/40" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 bg-black/5 rounded-full px-4 py-2.5 text-sm outline-none focus:bg-white transition-colors"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="p-2.5 rounded-full bg-blue-500 text-white disabled:opacity-50 transition-opacity"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add src/components/Builder/ChatPanel.tsx src/components/Builder/ChatMessage.tsx
git commit -m "feat: add chat panel and message components"
```

---

### Task 7: Create Preview Panel Component

**Files:**
- Create: `src/components/Builder/PreviewPanel.tsx`

**Step 1: Create the preview panel**

```typescript
// src/components/Builder/PreviewPanel.tsx
'use client';

import { useState } from 'react';
import { Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, Code } from 'lucide-react';

interface PreviewPanelProps {
  previewUrl: string | null;
  consoleOutput: string[];
}

type DeviceMode = 'desktop' | 'tablet' | 'mobile';

const DEVICE_SIZES: Record<DeviceMode, { width: string; height: string }> = {
  desktop: { width: '100%', height: '100%' },
  tablet: { width: '768px', height: '100%' },
  mobile: { width: '375px', height: '100%' },
};

export default function PreviewPanel({ previewUrl, consoleOutput }: PreviewPanelProps) {
  const [deviceMode, setDeviceMode] = useState<DeviceMode>('desktop');
  const [showConsole, setShowConsole] = useState(false);
  const [mode, setMode] = useState<'preview' | 'live'>('preview');

  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="h-12 px-3 flex items-center justify-between border-b border-black/5 bg-white/50">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMode('preview')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'preview' ? 'bg-blue-500 text-white' : 'text-black/60 hover:bg-black/5'
            }`}
          >
            Preview
          </button>
          <button
            onClick={() => setMode('live')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              mode === 'live' ? 'bg-green-500 text-white' : 'text-black/60 hover:bg-black/5'
            }`}
          >
            Live
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setDeviceMode('desktop')}
            className={`p-1.5 rounded-lg transition-colors ${
              deviceMode === 'desktop' ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Monitor size={16} />
          </button>
          <button
            onClick={() => setDeviceMode('tablet')}
            className={`p-1.5 rounded-lg transition-colors ${
              deviceMode === 'tablet' ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Tablet size={16} />
          </button>
          <button
            onClick={() => setDeviceMode('mobile')}
            className={`p-1.5 rounded-lg transition-colors ${
              deviceMode === 'mobile' ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Smartphone size={16} />
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <RefreshCw size={16} />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-black/5 transition-colors">
            <ExternalLink size={16} />
          </button>
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`p-1.5 rounded-lg transition-colors ${
              showConsole ? 'bg-black/10' : 'hover:bg-black/5'
            }`}
          >
            <Code size={16} />
          </button>
        </div>
      </div>

      {/* Preview Area */}
      <div className="flex-1 flex items-center justify-center p-4 bg-[#1a1a1a] overflow-hidden">
        {previewUrl ? (
          <div
            className="bg-white rounded-lg overflow-hidden shadow-lg transition-all duration-200"
            style={DEVICE_SIZES[deviceMode]}
          >
            <iframe
              src={previewUrl}
              className="w-full h-full border-0"
              title="Preview"
            />
          </div>
        ) : (
          <div className="text-center text-white/40">
            <Monitor size={48} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">No preview available</p>
            <p className="text-xs mt-1">Build something to see it here</p>
          </div>
        )}
      </div>

      {/* Console */}
      {showConsole && (
        <div className="h-40 border-t border-black/5 bg-[#1a1a1a] overflow-y-auto">
          <div className="p-2 font-mono text-xs text-white/80">
            {consoleOutput.length === 0 ? (
              <div className="text-white/40">Console output will appear here...</div>
            ) : (
              consoleOutput.map((line, i) => (
                <div key={i} className="py-0.5">{line}</div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add src/components/Builder/PreviewPanel.tsx
git commit -m "feat: add preview panel component"
```

---

## Phase 3: Builder Page Integration

### Task 8: Create Builder Page

**Files:**
- Create: `app/builder/page.tsx`

**Step 1: Create the builder page**

```typescript
// app/builder/page.tsx
'use client';

import { useState, useCallback } from 'react';
import BuilderLayout from '@/src/components/Builder/BuilderLayout';
import AgentPanel from '@/src/components/Builder/AgentPanel';
import ChatPanel from '@/src/components/Builder/ChatPanel';
import PreviewPanel from '@/src/components/Builder/PreviewPanel';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

export default function BuilderPage() {
  const [selectedAgent, setSelectedAgent] = useState('build');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [memoryCount] = useState(2847);
  const [tournamentStatus] = useState<'idle' | 'ready' | 'running'>('idle');

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    // Add streaming placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true,
    };
    setMessages(prev => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/builder/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: content, agent: selectedAgent }),
      });

      const data = await response.json();

      // Update with actual response
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: data.content, isStreaming: false }
          : m
      ));
    } catch (error) {
      setMessages(prev => prev.map(m =>
        m.id === assistantMessage.id
          ? { ...m, content: 'Sorry, there was an error processing your request.', isStreaming: false }
          : m
      ));
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgent]);

  return (
    <BuilderLayout
      agentPanel={
        <AgentPanel
          selectedAgent={selectedAgent}
          onSelectAgent={setSelectedAgent}
          memoryCount={memoryCount}
          tournamentStatus={tournamentStatus}
        />
      }
      chatPanel={
        <ChatPanel
          messages={messages}
          onSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      }
      previewPanel={
        <PreviewPanel
          previewUrl={previewUrl}
          consoleOutput={consoleOutput}
        />
      }
    />
  );
}
```

**Step 2: Commit**

```bash
git add app/builder/page.tsx
git commit -m "feat: add builder page with full layout integration"
```

---

### Task 9: Create Chat API Route

**Files:**
- Create: `app/api/builder/chat/route.ts`

**Step 1: Create the chat API route**

```typescript
// app/api/builder/chat/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

interface ChatRequest {
  message: string;
  agent: string;
  tournamentModels?: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json();
    const { message, agent } = body;

    // Log the request
    console.log(`[${agent}] ${message}`);

    // TODO: Integrate with actual LLM providers
    // For now, return a placeholder response
    const response = {
      content: `I received your message: "${message}"\n\nI'm ready to help you build! As the ${agent} agent, I can assist with:\n\n- Writing code\n- Debugging issues\n- Explaining concepts\n- Reviewing your work\n\nWhat would you like to do?`,
      agent,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Chat error:', error);
    return NextResponse.json(
      { error: 'Failed to process message' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/builder/chat/route.ts
git commit -m "feat: add chat API route with placeholder response"
```

---

## Phase 4: Tournament Integration

### Task 10: Create Tournament API Routes

**Files:**
- Create: `app/api/builder/tournament/route.ts`

**Step 1: Create tournament creation endpoint**

```typescript
// app/api/builder/tournament/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

interface TournamentRequest {
  prompt: string;
  models: string[];
  debateMode?: boolean;
  rounds?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: TournamentRequest = await request.json();
    const { prompt, models, debateMode = false, rounds = 1 } = body;

    // Create tournament record
    const [tournament] = await sql`
      INSERT INTO llm_tournaments (
        prompt,
        models_used,
        debate_mode,
        rounds,
        status,
        created_at
      ) VALUES (
        ${prompt},
        ${models},
        ${debateMode},
        ${rounds},
        'pending',
        NOW()
      )
      RETURNING id, *
    `;

    // TODO: Trigger actual LLM calls
    // For now, return the tournament with pending status
    return NextResponse.json({
      tournament,
      message: 'Tournament created. LLM integration pending.',
    });
  } catch (error) {
    console.error('Tournament creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create tournament' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tournamentId = searchParams.get('id');

    if (tournamentId) {
      const [tournament] = await sql`
        SELECT * FROM llm_tournaments WHERE id = ${tournamentId}
      `;

      if (!tournament) {
        return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
      }

      const responses = await sql`
        SELECT * FROM llm_responses WHERE tournament_id = ${tournamentId}
      `;

      return NextResponse.json({ tournament, responses });
    }

    // List recent tournaments
    const tournaments = await sql`
      SELECT * FROM llm_tournaments
      ORDER BY created_at DESC
      LIMIT 20
    `;

    return NextResponse.json({ tournaments });
  } catch (error) {
    console.error('Tournament fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tournaments' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/builder/tournament/route.ts
git commit -m "feat: add tournament API routes for creation and retrieval"
```

---

## Phase 5: Memory Integration

### Task 11: Create Memory API Routes

**Files:**
- Create: `app/api/builder/memory/route.ts`

**Step 1: Create memory search and creation endpoints**

```typescript
// app/api/builder/memory/route.ts
import { NextRequest, NextResponse } from 'next/server';
import sql from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');

    if (query) {
      // Search memories using full-text search
      const memories = await sql`
        SELECT
          id,
          title,
          content,
          memory_type,
          tags,
          domain,
          summary,
          created_at
        FROM memories
        WHERE
          search_tsv @@ plainto_tsquery('english', ${query})
          OR title ILIKE ${`%${query}%`}
          OR content ILIKE ${`%${query}%`}
        ORDER BY created_at DESC
        LIMIT ${limit}
      `;

      return NextResponse.json({ memories, query });
    }

    // List recent memories
    const memories = await sql`
      SELECT
        id,
        title,
        content,
        memory_type,
        tags,
        domain,
        summary,
        created_at
      FROM memories
      ORDER BY created_at DESC
      LIMIT ${limit}
    `;

    // Get total count
    const [{ count }] = await sql`
      SELECT COUNT(*) as count FROM memories
    `;

    return NextResponse.json({ memories, total: count });
  } catch (error) {
    console.error('Memory search error:', error);
    return NextResponse.json(
      { error: 'Failed to search memories' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      content,
      memory_type = 'note',
      tags = [],
      domain,
      summary,
      user_id,
      workspace_id,
    } = body;

    const [memory] = await sql`
      INSERT INTO memories (
        title,
        content,
        memory_type,
        tags,
        domain,
        summary,
        user_id,
        workspace_id,
        created_at,
        updated_at
      ) VALUES (
        ${title},
        ${content},
        ${memory_type},
        ${tags},
        ${domain},
        ${summary},
        ${user_id || null},
        ${workspace_id || null},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json({ memory });
  } catch (error) {
    console.error('Memory creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create memory' },
      { status: 500 }
    );
  }
}
```

**Step 2: Commit**

```bash
git add app/api/builder/memory/route.ts
git commit -m "feat: add memory API routes for search and creation"
```

---

## Phase 6: Testing & Verification

### Task 12: Create Integration Test

**Files:**
- Create: `tests/builder/api.test.ts`

**Step 1: Create API integration tests**

```typescript
// tests/builder/api.test.ts
import { describe, it, expect } from 'vitest';

describe('Builder API', () => {
  it('health check should return healthy status', async () => {
    const response = await fetch('http://localhost:3000/api/health');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.database).toBe('connected');
  });

  it('chat endpoint should accept messages', async () => {
    const response = await fetch('http://localhost:3000/api/builder/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Hello, agent!',
        agent: 'build',
      }),
    });

    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.content).toBeDefined();
    expect(data.agent).toBe('build');
  });

  it('memory search should return results', async () => {
    const response = await fetch('http://localhost:3000/api/builder/memory');
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.memories).toBeDefined();
    expect(data.total).toBeDefined();
  });
});
```

**Step 2: Run tests**

Run: `npm test`
Expected: All tests pass

**Step 3: Commit**

```bash
git add tests/builder/api.test.ts
git commit -m "test: add builder API integration tests"
```

---

### Task 13: Final Verification

**Step 1: Run the development server**

```bash
cd "C:\data\projects\geometry_os\geometry_os\mori\apps\eventureai\Dev\eventureai"
npm run dev
```

**Step 2: Verify all routes work**

Visit each route and verify:
- `http://localhost:3000/api/health` - Returns healthy status
- `http://localhost:3000/builder` - Shows builder interface
- `http://localhost:3000/api/builder/memory` - Returns memory list

**Step 3: Test the UI**

1. Open `http://localhost:3000/builder`
2. Verify three-panel layout displays correctly
3. Click on different agents in sidebar
4. Send a message in chat
5. Toggle preview panel device modes
6. Toggle console view

**Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete app builder UI foundation

- Add builder layout with three-panel design
- Implement agent panel with status indicators
- Create chat panel with streaming support
- Add preview panel with device mode switching
- Integrate with Neon database
- Add tournament and memory API routes
- Include integration tests"
```

---

## Summary

This implementation plan creates the foundation for the EventureAI App Builder UI:

1. **Phase 1:** Database connection and health check
2. **Phase 2:** Core layout components (Agent Panel, Chat Panel, Preview Panel)
3. **Phase 3:** Builder page integration
4. **Phase 4:** Tournament API routes
5. **Phase 5:** Memory API routes
6. **Phase 6:** Testing and verification

**Total Tasks:** 13
**Estimated Commits:** 13+

---

## Next Steps (Post-Implementation)

1. **LLM Provider Integration:** Connect to actual Anthropic, OpenAI, Google, etc. APIs
2. **Streaming SSE:** Implement real-time streaming responses
3. **Preview Sync:** Connect preview panel to actual build output
4. **Tournament Execution:** Implement multi-model parallel execution
5. **Memory Context:** Auto-inject relevant memories into prompts
6. **Authentication:** Integrate with custom auth system
7. **Error Tracking:** Connect to Mori error chains
