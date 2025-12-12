// FILE: app/(marketing)/cookies/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
import { CookiesContent, LegalPageSection } from "@/components/marketing";
import type { Metadata } from "next";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Cookie Notice | Corso",
  description: "Information about cookies and tracking technologies used on the Corso platform.",
  openGraph: {
    title: "Cookie Notice | Corso",
    description: "Information about cookies and tracking technologies used on the Corso platform.",
    type: "website",
  },
  alternates: { canonical: "/cookies" },
} satisfies Metadata;

export default function CookiesPage() {
  return (
    <LegalPageSection title="Cookie Notice" subtitle="Corso" headingLevel={1}>
      <CookiesContent />
    </LegalPageSection>
  );
}
