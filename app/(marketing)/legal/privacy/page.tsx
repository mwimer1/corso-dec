// FILE: app/(marketing)/legal/privacy/page.tsx
// Alias route for /legal/privacy -> redirects to /privacy
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export default function LegalPrivacyPage() {
  redirect('/privacy');
}

