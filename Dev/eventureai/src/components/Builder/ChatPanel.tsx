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
