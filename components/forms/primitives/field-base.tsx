// components/forms/_shared/form-field-base.tsx
"use client";

import { Label } from "@/components/ui/atoms/label";
import { cn } from "@/styles";
import type { contactFormVariants } from "@/styles/ui/organisms";
import type { ContactFormField } from "@/types/forms";
import * as React from "react";

/**
 * Provides unified wiring for label htmlFor, help+error aria-describedby, and id generation.
 * - children receives (fieldId, describedBy)
 * - When `errorText` is present, `aria-invalid` should be applied by the child control.
 */
export const FormFieldBase: React.FC<{
  field: ContactFormField;
  variants: ReturnType<typeof contactFormVariants>;
  className?: string;
  id?: string;
  extraDescribedBy?: string | string[];
  labelProps?: React.LabelHTMLAttributes<HTMLLabelElement>;
  children: (fieldId: string, describedBy: string, errorId?: string) => React.ReactNode;
}> = ({
  field,
  variants,
  className,
  id,
  extraDescribedBy,
  labelProps,
  children,
}) => {
  const reactGeneratedId = React.useId();
  const { key, label, required, helpText, errorText } = field;

  const fieldId = React.useMemo(() => {
    if (id) return id;
    if (key) return `contact-${String(key)}`;
    return `contact-${reactGeneratedId}`;
  }, [id, key, reactGeneratedId]);

  const helpId = helpText ? `${fieldId}-help` : undefined;
  const errorId = errorText ? `${fieldId}-error` : undefined;

  const extras = React.useMemo(() => (
    Array.isArray(extraDescribedBy)
      ? extraDescribedBy
      : extraDescribedBy
      ? [extraDescribedBy]
      : []
  ), [extraDescribedBy]);

  // Build describedBy in stable help → error → extras order, de-duped and trimmed
  const describedBy = React.useMemo(() => {
    const tokens = [helpId, errorId, ...extras]
      .filter((t): t is string => Boolean(t))
      .map((t) => t.trim())
      .filter((t) => t.length > 0);
    const deduped = Array.from(new Set(tokens));
    return deduped.join(" ");
  }, [helpId, errorId, extras]);

  return (
    <div className={cn(variants.fieldGroup(), className)}>
      <Label
        htmlFor={fieldId}
        className={variants.fieldLabel()}
        required={required ?? false}
        {...labelProps}
      >
        {label}
      </Label>

      <div className={variants.fieldInputContainer()}>
        {children(fieldId, describedBy, errorId)}
      </div>

      {helpText ? (
        <p id={helpId} className={cn("mt-1 text-sm text-muted-foreground")}>{helpText}</p>
      ) : null}

      {errorText ? (
        <p id={errorId} role="alert" aria-live="polite" className={cn("mt-1 text-sm text-destructive")}>{errorText}</p>
      ) : null}
    </div>
  );
};

FormFieldBase.displayName = "FormFieldBase";


