// FILE: app/(marketing)/contact/page.tsx
// Runtime: kept on nodejs due to Clerk keyless telemetry (see app/(marketing)/README.md)
import { submitContactForm } from "./actions";
import { MarketingContainer } from "@/components/marketing";
import { ContactFormWrapper, ContactInfo, ContactLayout } from "@/components/marketing";
import type { ContactFormSubmitData } from "@/types/forms";
import type { Metadata } from "next";

/** @knipignore */
export const runtime = "nodejs";

/** @knipignore */
export const metadata: Metadata = {
  title: "Contact | Corso",
  description: "Get in touch with the Corso team.",
  openGraph: {
    title: "Contact | Corso",
    description: "Get in touch with the Corso team.",
    type: "website",
  },
  alternates: { canonical: "/contact" },
} satisfies Metadata;

export default function ContactPage() {
  // Server action for contact form submissions (colocated with feature)
  const handleFormSubmit = async (data: ContactFormSubmitData): Promise<void> => {
    "use server";
    await submitContactForm(data);
  };

  return (
    <MarketingContainer>
      <ContactLayout>
        <div className="rounded-lg border border-border bg-surface p-xl shadow-card">
          <ContactFormWrapper
            title="Send us a message"
            description="Fill out the form below and we'll get back to you within one business day."
            onSubmit={handleFormSubmit}
            successMessage="Thank you for your message! We'll get back to you within one business day."
            errorMessage="There was an error sending your message. Please try again or contact us directly."
          />
        </div>
        <ContactInfo />
      </ContactLayout>
    </MarketingContainer>
  );
}
