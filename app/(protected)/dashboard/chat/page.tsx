export const runtime = 'edge';

import { ChatPage } from '@/components/chat';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Chat | Dashboard | Corso',
  description: 'Corso AI chat workspace',
};

export default function DashboardChatPage() {
  return <ChatPage />;
}
