// FILE: app/(marketing)/status/page.tsx
// System status page placeholder
import { LegalPageSection } from '@/components/marketing';
import type { Metadata } from 'next';

/** @knipignore */
export const runtime = 'nodejs';

/** @knipignore */
export const metadata: Metadata = {
  title: 'Status | Corso',
  description: 'Corso system status and uptime information.',
  robots: 'noindex',
  alternates: { canonical: '/status' },
} satisfies Metadata;

export default function StatusPage() {
  return (
    <LegalPageSection title="System Status" subtitle="Corso" headingLevel={1}>
      <div className="prose prose-slate max-w-none">
        <p className="text-muted-foreground">
          All systems are operational. For detailed status information and incident reports,
          please check our status page.
        </p>
        
        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h3 className="text-lg font-semibold mb-2">System Status</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>API Services: Operational</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Database: Operational</span>
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span>Authentication: Operational</span>
            </li>
          </ul>
        </div>

        <p className="mt-6 text-sm text-muted-foreground">
          Last updated: {new Date().toLocaleDateString()}
        </p>
      </div>
    </LegalPageSection>
  );
}

