// FILE: app/(marketing)/security/page.tsx
// Security information page
import { LegalPageSection } from '@/components/marketing';
import type { Metadata } from 'next';

export const runtime = 'nodejs';

export const metadata: Metadata = {
  title: 'Security | Corso',
  description: 'Security practices and compliance information for Corso.',
  robots: 'noindex',
  alternates: { canonical: '/security' },
} satisfies Metadata;

export default function SecurityPage() {
  return (
    <LegalPageSection title="Security" subtitle="Corso" headingLevel={1}>
      <div className="prose prose-slate max-w-none">
        <p className="text-muted-foreground">
          Security is a top priority at Corso. We implement industry-standard security practices
          to protect your data and ensure compliance with security standards.
        </p>
        
        <h2>Security Practices</h2>
        <ul>
          <li>End-to-end encryption for data in transit</li>
          <li>Secure authentication via Clerk</li>
          <li>Regular security audits and penetration testing</li>
          <li>Compliance with industry security standards</li>
        </ul>

        <h2>Reporting Security Issues</h2>
        <p>
          If you discover a security vulnerability, please report it responsibly through our{' '}
          <a href="https://github.com/Corso222/corso-app/security/advisories/new" target="_blank" rel="noopener noreferrer">
            Security Advisories
          </a>{' '}
          page.
        </p>

        <h2>Contact</h2>
        <p>
          For security-related questions, please contact{' '}
          <a href="mailto:security@corso.dev">security@corso.dev</a>.
        </p>
      </div>
    </LegalPageSection>
  );
}

