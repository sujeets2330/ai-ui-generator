'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
}

export function ChatMessage({ role, content, timestamp }: ChatMessageProps) {
  const isUser = role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex items-start gap-2 max-w-[85%] ${isUser ? 'flex-row-reverse' : ''}`}>
        {/* Avatar */}
        <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
          isUser 
            ? 'bg-blue-600 text-white' 
            : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300'
        }`}>
          {isUser ? <User className="w-3 h-3" /> : <Bot className="w-3 h-3" />}
        </div>
        
        {/* Message Content */}
        <div>
          <div
            className={`px-3 py-2 rounded-lg text-sm ${
              isUser
                ? 'bg-blue-600 text-white rounded-br-none'
                : 'bg-muted text-foreground rounded-bl-none'
            }`}
          >
            {content}
          </div>
          
          {/* Timestamp */}
          {timestamp && (
            <p className="text-xs text-muted-foreground mt-1 px-1">
              {timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              {!isUser && ' • AI Assistant'}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}