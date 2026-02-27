'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Paperclip, Bot, User, Loader2, Hammer, Bug, Rocket, Trophy, Brain } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  isStreaming?: boolean;
}

interface AgentInfo {
  id: string;
  name: string;
  type: 'build' | 'dev' | 'live';
  status: 'idle' | 'thinking' | 'building' | 'debugging' | 'deploying';
  icon: typeof Hammer;
}

const AGENTS: AgentInfo[] = [
  { id: 'build', name: 'Builder', type: 'build', status: 'idle', icon: Hammer },
  { id: 'dev', name: 'Debugger', type: 'dev', status: 'idle', icon: Bug },
  { id: 'live', name: 'Live Monitor', type: 'live', status: 'idle', icon: Rocket },
];

const STATUS_COLORS = {
  idle: 'bg-gray-400',
  thinking: 'bg-yellow-500 animate-pulse',
  building: 'bg-blue-500 animate-pulse',
  debugging: 'bg-orange-500 animate-pulse',
  deploying: 'bg-green-500 animate-pulse',
};

export default function BuilderChat() {
  const [selectedAgent, setSelectedAgent] = useState('build');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [agentStatus, setAgentStatus] = useState<Record<string, string>>({
    build: 'idle',
    dev: 'idle',
    live: 'idle',
  });
  const [memoryCount] = useState(2847);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = useCallback(async (content: string) => {
    if (!content.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setAgentStatus((prev) => ({ ...prev, [selectedAgent]: 'thinking' }));

    // Add streaming placeholder
    const assistantMessage: Message = {
      id: (Date.now() + 1).toString(),
      role: 'assistant',
      content: '',
      timestamp: new Date().toLocaleTimeString(),
      isStreaming: true,
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/builder/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: content,
          agent: selectedAgent,
          conversationHistory: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No reader available');
      }

      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'delta' && data.text) {
                fullContent += data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id ? { ...m, content: fullContent } : m
                  )
                );
              } else if (data.type === 'done') {
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantMessage.id ? { ...m, isStreaming: false } : m
                  )
                );
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      setAgentStatus((prev) => ({ ...prev, [selectedAgent]: 'idle' }));
    } catch (error) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantMessage.id
            ? {
                ...m,
                content: `Sorry, there was an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isStreaming: false,
              }
            : m
        )
      );
      setAgentStatus((prev) => ({ ...prev, [selectedAgent]: 'idle' }));
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgent, messages, isLoading]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(input);
  };

  return (
    <div className="h-screen flex flex-col bg-[#F2F2F7]">
      {/* Top Bar */}
      <header className="h-14 px-4 flex items-center justify-between bg-white/80 backdrop-blur-md border-b border-black/5">
        <div className="flex items-center gap-3">
          <span className="font-semibold text-lg">EventureAI Builder</span>
        </div>
        <div className="flex items-center gap-3">
          <select className="text-sm bg-black/5 rounded-lg px-3 py-1.5 outline-none">
            <option>Claude Sonnet 4</option>
            <option>Claude Opus 4</option>
          </select>
          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-sm font-semibold">
            U
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Agent Sidebar */}
        <aside className="w-60 border-r border-black/5 bg-white/50 overflow-y-auto p-3 space-y-4">
          {/* Agents Section */}
          <div>
            <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-2 py-1">
              Agents
            </h3>
            <nav className="mt-1 space-y-0.5">
              {AGENTS.map((agent) => {
                const Icon = agent.icon;
                const isSelected = selectedAgent === agent.id;
                const status = agentStatus[agent.id] || 'idle';
                return (
                  <button
                    key={agent.id}
                    onClick={() => setSelectedAgent(agent.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                      isSelected
                        ? 'bg-white shadow-sm text-blue-500 font-semibold'
                        : 'text-black/60 hover:bg-black/5'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="flex-1 text-left text-sm">{agent.name}</span>
                    <div className={`${STATUS_COLORS[status as keyof typeof STATUS_COLORS]} w-2 h-2 rounded-full`} />
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tournament Section */}
          <div>
            <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-2 py-1">
              Tournament
            </h3>
            <div className="mt-1 px-3 py-2.5 flex items-center gap-2">
              <Trophy size={16} className="text-black/40" />
              <span className="text-sm text-black/60">No active tournament</span>
            </div>
          </div>

          {/* Memory Section */}
          <div>
            <h3 className="text-[10px] font-bold text-black/40 uppercase tracking-widest px-2 py-1">
              Memory
            </h3>
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
          </div>
        </aside>

        {/* Chat Panel */}
        <main className="flex-1 flex flex-col overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center text-black/40">
                <div className="text-center">
                  <div className="text-4xl mb-2">
                    <Bot size={48} className="mx-auto opacity-50" />
                  </div>
                  <p className="text-sm">Start a conversation with your AI agent</p>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''} p-4`}>
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-purple-500 text-white'
                    }`}
                  >
                    {msg.role === 'user' ? <User size={16} /> : <Bot size={16} />}
                  </div>
                  <div className={`flex-1 max-w-[80%] ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`inline-block text-left p-3 rounded-2xl ${
                        msg.role === 'user' ? 'bg-blue-500 text-white' : 'bg-white shadow-sm'
                      }`}
                    >
                      <div className="text-sm whitespace-pre-wrap">
                        {msg.content}
                        {msg.isStreaming && (
                          <span className="inline-block w-2 h-4 bg-current animate-pulse ml-1" />
                        )}
                      </div>
                    </div>
                    <div className={`text-[10px] text-black/40 mt-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                      {msg.timestamp}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-black/5 bg-white/50">
            <form onSubmit={handleSubmit} className="flex items-center gap-2">
              <button type="button" className="p-2 rounded-full hover:bg-black/5 transition-colors">
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
                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
              </button>
            </form>
          </div>
        </main>

        {/* Preview Panel */}
        <aside className="w-[400px] border-l border-black/5 bg-white/50 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Preview Header */}
            <div className="h-12 px-3 flex items-center justify-between border-b border-black/5 bg-white/50">
              <div className="flex items-center gap-1">
                <button className="px-3 py-1.5 rounded-lg text-sm font-medium bg-blue-500 text-white">
                  Preview
                </button>
                <button className="px-3 py-1.5 rounded-lg text-sm font-medium text-black/60 hover:bg-black/5">
                  Live
                </button>
              </div>
            </div>

            {/* Preview Area */}
            <div className="flex-1 flex items-center justify-center p-4 bg-[#1a1a1a]">
              <div className="text-center text-white/40">
                <Bot size={48} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">No preview available</p>
                <p className="text-xs mt-1">Build something to see it here</p>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
