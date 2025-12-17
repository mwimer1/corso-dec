export const runtime = 'nodejs';

import { ChatPage } from '@/components/chat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | Dashboard | Corso',
  description: 'Corso AI chat workspace',
};

export default function DashboardChatPage() {
  return (
    <>
      {/* Accessible page title for screen readers */}
      <h1 className="sr-only">Chat</h1>
      <ChatPage />
    </>
  );
}
