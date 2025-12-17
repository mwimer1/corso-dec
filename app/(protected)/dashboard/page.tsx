import { redirect } from 'next/navigation';

/**
 * Dashboard index route redirects to chat (default dashboard landing).
 * This ensures users navigating to /dashboard are automatically sent to /dashboard/chat.
 */
export default function DashboardIndexPage() {
  redirect('/dashboard/chat');
}
