"use client";

// Import the proper type from the forms domain
import type { ContactFormSubmitData } from "@/types/forms";
import dynamic from "next/dynamic";
import { Suspense } from "react";

// Dynamic import for large ContactForm component (8.7KB) - now legal in client component
const ContactForm = dynamic(
  () =>
  import("@/components/forms").then((m) => ({
      default: m.ContactForm,
    })),
  {
    loading: () => (
      <div className={"px-4 sm:px-6 lg:px-8"}>
        <div className="mx-auto w-full max-w-5xl">
          <div className="animate-pulse motion-reduce:animate-none motion-reduce:transition-none rounded-lg border border-border bg-surface p-xl shadow-card">
            <div className="space-y-md">
              <div className="h-6 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
              <div className="space-y-sm">
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
                <div className="h-24 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded w-1/4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
);

interface ContactFormWrapperProps {
  title: string;
  description: string;
  onSubmit: (data: ContactFormSubmitData) => void | Promise<void>;
  successMessage: string;
  errorMessage: string;
  csrfToken?: string;
}

export function ContactFormWrapper({ onSubmit, ...rest }: ContactFormWrapperProps) {
  return (
    <Suspense
      fallback={
        <div className="animate-pulse motion-reduce:animate-none motion-reduce:transition-none space-y-md">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="h-4 bg-muted rounded w-2/3"></div>
          <div className="space-y-sm">
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded"></div>
            <div className="h-24 bg-muted rounded"></div>
            <div className="h-10 bg-muted rounded w-1/4"></div>
          </div>
        </div>
      }
    >
      <ContactForm {...rest} onSubmit={onSubmit} />
    </Suspense>
  );
}
