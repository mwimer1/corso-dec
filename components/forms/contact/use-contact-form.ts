// components/forms/useContactForm.ts
"use client";

import { logger } from "@/lib/shared/config/client";
import type { ContactFormData, ContactFormSubmitData, UseContactFormProps } from "@/types/forms";
import * as React from "react";

// Types are available from @/types/forms - no need to re-export

const INITIAL_FORM_DATA: ContactFormData = {
  name: "",
  email: "",
  company: "",
  message: "",
  subject: "",
  phone: "",
};

// UseContactFormProps is now imported from @/types/forms

export const useContactForm = (props: UseContactFormProps) => {
    const [formData, setFormData] = React.useState<ContactFormData>(INITIAL_FORM_DATA);
    const [internalLoading, setInternalLoading] = React.useState(false);
    const [status, setStatus] = React.useState<"idle" | "success" | "error">(
        "idle",
    );
    const [turnstileToken, setTurnstileToken] = React.useState("");

    const handleSubmit = async (
        e: React.FormEvent<HTMLFormElement>,
    ): Promise<void> => {
        e.preventDefault();

        const requiredFields = props.fields.filter((field: { key: keyof ContactFormData; required?: boolean }) => field.required);
        const missingFields = requiredFields.filter(
            (field: { key: keyof ContactFormData; required?: boolean }) => !formData[field.key]?.trim(),
        );

        if (missingFields.length > 0) {
            setStatus("error");
            return;
        }

        setInternalLoading(true);
        setStatus("idle");

        try {
            const submitData: ContactFormSubmitData = {
                ...formData,
                turnstileToken,
            };
            if (props.onSubmit) {
                await props.onSubmit(submitData);
            }
            setFormData(INITIAL_FORM_DATA);
            setStatus("success");
        } catch (error) {
            logger.error("[ContactForm] submission error", error);
            setStatus("error");
        } finally {
            setInternalLoading(false);
        }
    };

    const handleChange =
        (field: keyof ContactFormData) =>
            (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>): void => {
                setFormData((prev: ContactFormData) => ({ ...prev, [field]: e.target.value }));
                if (status !== "idle") setStatus("idle");
            };
    
    const requiredFields = props.fields.filter((field: { key: keyof ContactFormData; required?: boolean }) => field.required);
    const isFormValid = requiredFields.every((field: { key: keyof ContactFormData; required?: boolean }) =>
        formData[field.key]?.trim(),
    );

    return {
        formData,
        isLoading: internalLoading,
        status,
        turnstileToken,
        setTurnstileToken,
        handleSubmit,
        handleChange,
        isFormValid
    };
}

