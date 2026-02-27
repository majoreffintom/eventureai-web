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
