// FILE: app/(marketing)/legal/terms/page.tsx
// Alias route for /legal/terms -> redirects to /terms
import { redirect } from 'next/navigation';

/** @knipignore */
export const runtime = 'nodejs';
/** @knipignore */
export const dynamic = 'force-dynamic';

export default function LegalTermsPage() {
  redirect('/terms');
}

