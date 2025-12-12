// FILE: app/(marketing)/legal/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
import { LegalPageSection } from "@/components/marketing";
import type { Metadata } from "next";
import Link from "next/link";

export const runtime = "nodejs";

export const metadata: Metadata = {
  title: "Legal | Corso",
  robots: "noindex",
  alternates: { canonical: "/legal" },
} satisfies Metadata;

export default function LegalIndexPage() {
  return (
    <LegalPageSection title="Legal" subtitle="Corso – Terms, Privacy, Cookies, Contact">
      <ul className="list-disc pl-6 space-y-2">
        <li>
          <Link href="/terms">Terms of Service</Link>
        </li>
        <li>
          <Link href="/privacy">Privacy Policy</Link>
        </li>
        <li>
          <Link href="/cookies">Cookie Notice</Link>
        </li>
        <li>
          <Link href="/contact">Contact</Link>
        </li>
      </ul>
    </LegalPageSection>
  );
}
