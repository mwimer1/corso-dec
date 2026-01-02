// FILE: app/(marketing)/terms/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
import { LegalPageSection, TermsContent } from "@/components/marketing";
import type { Metadata } from "next";

/** @knipignore */
export const runtime = "nodejs";

/** @knipignore */
export const metadata: Metadata = {
  title: "Terms of Service | Corso",
  description: "Legal terms and conditions for using the Corso platform.",
  openGraph: {
    title: "Terms of Service | Corso",
    description: "Legal terms and conditions for using the Corso platform.",
    type: "website",
  },
  alternates: { canonical: "/terms" },
} satisfies Metadata;

export default function TermsPage() {
  return (
    <LegalPageSection title="Terms of Service" subtitle="Corso" headingLevel={1}>
      <TermsContent />
    </LegalPageSection>
  );
}
