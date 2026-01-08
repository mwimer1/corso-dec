// types/forms/index.ts
// Form-related type definitions for Corso's form components

export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
  subject?: string;
  phone?: string;
}

export interface ContactFormSubmitData extends ContactFormData {
  turnstileToken?: string;
}

export interface ContactFormField {
  key: keyof ContactFormData;
  label: string;
  type: "text" | "email" | "tel" | "textarea";
  required?: boolean;
  placeholder?: string;
  helpText?: string;
  errorText?: string;
  extraDescribedBy?: string | string[];
}

export interface UseContactFormProps {
  onSubmit?: (data: ContactFormSubmitData) => void | Promise<void>;
  fields: { key: keyof ContactFormData; required?: boolean }[];
}

