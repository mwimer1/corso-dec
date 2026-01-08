// FILE: app/(marketing)/privacy/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
import { LegalPageSection, PrivacyContent } from "@/components/marketing";
import type { Metadata } from "next";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Privacy Policy | Corso",
  description: "Details on data collection, usage, and protection at Corso.",
  openGraph: {
    title: "Privacy Policy | Corso",
    description: "Details on data collection, usage, and protection at Corso.",
    type: "website",
  },
  alternates: { canonical: "/privacy" },
} satisfies Metadata;

export default function PrivacyPage() {
  return (
    <LegalPageSection title="Privacy Policy" subtitle="Corso" headingLevel={1}>
      <PrivacyContent />
    </LegalPageSection>
  );
}
