// FILE: app/(marketing)/legal/privacy/page.tsx
// Alias route for /legal/privacy -> redirects to /privacy
import { redirect } from 'next/navigation';

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';

export default function LegalPrivacyPage() {
  redirect('/privacy');
}

