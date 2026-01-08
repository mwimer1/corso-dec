// components/forms/_shared/field-renderer.tsx
'use client';

import { BuildingIcon, MailIcon, MessageSquareIcon, UserIcon } from "@/components/ui/atoms";
import { Input } from "@/components/ui/atoms/input";
import { TextArea } from "@/components/ui/molecules/text-area";
import { cn } from "@/styles";
import type { contactFormVariants } from "@/styles/ui/organisms";
import type { ContactFormField } from "@/types/forms";
import * as React from "react";
import { FormFieldBase } from "./field-base";

/**
 * Mapping of field keys to their corresponding icon components
 */
const FIELD_ICONS = {
  name: UserIcon,
  email: MailIcon,
  company: BuildingIcon,
} as const;

/**
 * Helper function to render field icons with consistent styling
 */
function renderFieldIcon(
  key: keyof typeof FIELD_ICONS,
  variants: ReturnType<typeof contactFormVariants>
) {
  const Icon = FIELD_ICONS[key];
  return Icon ? (
    <Icon className={cn(variants.fieldIcon(), variants.inputIcon())} />
  ) : null;
}

/**
 * Shared field renderer component that handles the common rendering logic
 * for both input and textarea fields
 */
export const FieldRenderer = React.memo<{
  field: ContactFormField;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  variants: ReturnType<typeof contactFormVariants>;
}>(({
  field,
  value,
  onChange,
  variants
}) => {
  const { key, type, required, placeholder, errorText } = field;

  function buildA11yProps(errorText?: string, describedBy?: string, errorId?: string) {
    return {
      "aria-describedby": describedBy || undefined,
      // ARIA expects strings; React tolerates booleans but strings are clearer
      "aria-invalid": errorText ? "true" : undefined,
      "aria-errormessage": errorText ? errorId : undefined,
    } as const;
  }

  return (
    <FormFieldBase
      field={field}
      variants={variants}
      {...(field.extraDescribedBy ? { extraDescribedBy: field.extraDescribedBy } : {})}
    >
      {(fieldId: string, describedBy: string, errorId?: string) => {
        const isTextarea = type === "textarea";

        const iconElement = isTextarea
          ? (
            <MessageSquareIcon
              className={cn(variants.fieldIcon(), variants.textareaIcon())}
            />
          )
          : (key in FIELD_ICONS
            ? renderFieldIcon(key as keyof typeof FIELD_ICONS, variants)
            : null);

        const a11yProps = buildA11yProps(errorText, describedBy ?? undefined, errorId);

        return (
          <>
            {iconElement}
            {isTextarea ? (
              <TextArea
                id={fieldId}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={cn(variants.textarea(), variants.textareaWithIcon())}
                required={required}
                {...a11yProps}
              />
            ) : (
              <Input
                id={fieldId}
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={iconElement ? variants.inputWithIcon() : variants.input()}
                required={required}
                {...a11yProps}
                aria-required={required || undefined}
              />
            )}
          </>
        );
      }}
    </FormFieldBase>
  );
});

FieldRenderer.displayName = "FieldRenderer";
