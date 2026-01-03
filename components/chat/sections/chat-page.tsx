"use client";

import { DashboardTopBar } from '@/components/dashboard/layout/dashboard-top-bar';
import { ChatModelDropdown } from '@/components/chat/components/chat-model-dropdown';
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
    <div className="flex flex-col h-full">
      <DashboardTopBar 
        currentPage="" 
        breadcrumbs={[]}
        actions={<ChatModelDropdown />}
        variant="chat"
      />
      <div className="flex-1 min-h-0">
        <ChatWindow />
      </div>
    </div>
  );
}
