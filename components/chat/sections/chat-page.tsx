"use client";

import { DashboardTopBar } from '@/components/dashboard/layout/dashboard-top-bar';
import { ChatModelDropdown } from '@/components/chat/components/chat-model-dropdown';
import { ChatWindow } from './chat-window';

export function ChatPage() {
  // Chat clearing is handled by ChatWindow component when ?new=true is detected
  // The clearChat() function from useChat handles both state and localStorage clearing

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
