"use client";

import { clearLocalChatHistory } from '@/lib/chat';
import { useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { ChatWindow } from './chat-window';

export function ChatPage() {
  const searchParams = useSearchParams();
  
  // If URL has ?new=true, clear any saved chat history on mount
  useEffect(() => {
    const isNewChat = searchParams?.get('new') !== null;
    if (isNewChat) {
      try {
        clearLocalChatHistory();
      } catch (err) {
        console.error('Failed to clear chat history for new chat:', err);
      }
    }
  }, [searchParams]);

  return (
    <ChatWindow />
  );
}
