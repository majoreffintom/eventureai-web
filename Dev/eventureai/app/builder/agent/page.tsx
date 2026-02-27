'use client';

import { useState, useCallback, useEffect } from 'react';
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

export default function AgentBuilderPage() {
  const [selectedAgent, setSelectedAgent] = useState('build');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [memoryCount, setMemoryCount] = useState(2847);
  const [tournamentStatus, setTournamentStatus] = useState<'idle' | 'ready' | 'running'>('idle');
  const [conversationId, setConversationId] = useState<string | null>(null);

  // Fetch memory count on mount
  useEffect(() => {
    async function fetchMemoryCount() {
      try {
        const response = await fetch('/api/builder/memory');
        const data = await response.json();
        if (data.total) {
          setMemoryCount(data.total);
        }
      } catch (err) {
        console.error('Failed to fetch memory count:', err);
      }
    }
    fetchMemoryCount();
  }, []);

  // Reset conversation when switching agents
  const handleSelectAgent = (agentId: string) => {
    setSelectedAgent(agentId);
    setMessages([]);
    setConversationId(null);
  };

  const handleSendMessage = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

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
                // Update memory count
                setMemoryCount((prev) => prev + 1);
              } else if (data.type === 'error') {
                throw new Error(data.error);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }
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
    } finally {
      setIsLoading(false);
    }
  }, [selectedAgent, messages]);

  return (
    <BuilderLayout
      agentPanel={
        <AgentPanel
          selectedAgent={selectedAgent}
          onSelectAgent={handleSelectAgent}
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
        <PreviewPanel previewUrl={previewUrl} consoleOutput={consoleOutput} />
      }
    />
  );
}
