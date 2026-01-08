// components/forms/ContactForm.tsx
'use client';

import { MessageSquareIcon } from "@/components/ui/atoms";
import { Button } from "@/components/ui/atoms/button";
import { Spinner } from "@/components/ui/atoms/spinner";
import { FieldRenderer } from "../primitives/field-renderer";
import { publicEnv } from "@/lib/shared/config/client";

import { cn } from "@/styles";
import {
    contactFormVariants,
    type ContactFormVariantProps,
} from "@/styles/ui/organisms";
import type { ContactFormField, ContactFormSubmitData } from "@/types/forms";
import Script from "next/script";
import * as React from "react";
import { useContactForm } from "./use-contact-form";

const defaultFields: ContactFormField[] = [
    {
      key: "name",
      label: "Name",
      type: "text",
      required: true,
      placeholder: "Your full name",
    },
    {
      key: "email",
      label: "Email*",
      type: "email",
      required: true,
      placeholder: "your.email@company.com",
    },
    {
      key: "company",
      label: "Company",
      type: "text",
      placeholder: "Your company name",
    },
    {
      key: "message",
      label: "Message",
      type: "textarea",
      required: true,
      placeholder: "Tell us about your project and how we can help...",
    },
  ];

interface ContactFormProps
  extends Omit<React.HTMLAttributes<HTMLFormElement>, "onSubmit">,
    ContactFormVariantProps {
  onSubmit?: (data: ContactFormSubmitData) => void | Promise<void>;
  fields?: ContactFormField[];
  title?: string;
  description?: string;
  submitText?: string;
  isLoading?: boolean;
  successMessage?: string;
  errorMessage?: string;
  showCompanyField?: boolean;
  showSubjectField?: boolean;
  showPhoneField?: boolean;
  csrfToken?: string;
  layout?: "default" | "compact" | "spacious";
  size?: "sm" | "md" | "lg";
  variant?: "default" | "minimal" | "card" | "inline";
}

export const ContactForm = React.forwardRef<HTMLFormElement, ContactFormProps>(
  (
    {
      className,
      onSubmit,
      fields = defaultFields,
      title,
      description,
      submitText = "Send Message",
      isLoading: externalLoading,
      successMessage,
      errorMessage,
      showCompanyField = true,
      showSubjectField = false,
      showPhoneField = false,
      layout = "default",
      size = "md",
      variant = "default",
      csrfToken,
      ...props
    },
    ref,
  ) => {
    const visibleFields: ContactFormField[] = React.useMemo(() => {
        return fields.filter((field): field is ContactFormField & { key: ContactFormField["key"] } => {
          if (field.key === "company" && !showCompanyField) return false;
          if (field.key === "subject" && !showSubjectField) return false;
          if (field.key === "phone" && !showPhoneField) return false;
          return true;
        });
      }, [fields, showCompanyField, showSubjectField, showPhoneField]);

    const {
        formData,
        isLoading: internalLoading,
        status,
        turnstileToken,
        setTurnstileToken,
        handleSubmit,
        handleChange,
        isFormValid
    } = useContactForm({ ...props, fields: visibleFields });

    const isLoading = externalLoading ?? internalLoading;
    const variants = contactFormVariants({ layout, size, variant });

    return (
      <form
        ref={ref}
        onSubmit={(e) => void handleSubmit(e)}
        className={cn(variants.container(), className)}
        {...props}
      >
        {(title || description) && (
          <div className={variants.header()}>
            {title && <h2 className={variants.title()}>{title}</h2>}
            {description && (
              <p className={variants.description()}>{description}</p>
            )}
          </div>
        )}

        {status === "success" && successMessage && (
          <div className={variants.successMessage()} role="status" aria-live="polite">{successMessage}</div>
        )}

        {status === "error" && errorMessage && (
          <div className={variants.errorMessage()} role="alert" aria-live="assertive">{errorMessage}</div>
        )}

        <div className={variants.fieldsContainer()}>
            {visibleFields.map(field => (
                <FieldRenderer
                    key={field.key}
                    field={field}
                    value={formData[field.key] || ""}
                    onChange={handleChange(field.key)}
                    variants={variants}
                />
            ))}
        </div>

        {csrfToken && (
          <input type="hidden" name="csrfToken" value={csrfToken} />
        )}

        <Script
          src="https://challenges.cloudflare.com/turnstile/v0/api.js"
          strategy="lazyOnload"
        />
        <div className="my-md">
          <div
            className="cf-turnstile"
            data-sitekey={publicEnv.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
            data-callback={(token: string) => setTurnstileToken(token)}
          />
        </div>
        <input type="hidden" name="turnstileToken" value={turnstileToken} />

        <Button
          type="submit"
          disabled={isLoading || !isFormValid}
          className={variants.submitButton()}
        >
          {isLoading ? (
            <>
              <Spinner variant="secondary" />
              Sending…
            </>
          ) : (
            <>
              <MessageSquareIcon className="h-4 w-4" />
              {submitText}
            </>
          )}
        </Button>
      </form>
    );
  },
);

ContactForm.displayName = "ContactForm";
