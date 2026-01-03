---
status: "draft"
last_updated: "2026-01-03"
category: "types"
title: "Forms"
description: "TypeScript type definitions for types, ensuring type safety across the platform. Located in forms/."
---
# Forms Types

> **Type definitions for form components, form data structures, and form configuration interfaces.**

This directory contains TypeScript type definitions for form-related functionality, primarily focused on contact forms and form field configuration. These types ensure type-safe form handling throughout the Corso platform.

## 📋 Directory Structure

```
types/forms/
├── index.ts                    # Barrel exports for all form types
└── types.ts                    # Form type definitions
```

| File | Purpose | Key Types |
|------|---------|-----------|
| `types.ts` | All form type definitions | `ContactFormData`, `ContactFormSubmitData`, `ContactFormField`, `UseContactFormProps` |
| `index.ts` | Barrel exports | Re-exports all types from `types.ts` |

## 📝 Form Data Types

### `ContactFormData`

Base interface for contact form data structure. Represents the core fields collected in contact forms throughout the application.

```typescript
export interface ContactFormData {
  name: string;
  email: string;
  company?: string;
  message: string;
  subject?: string;
  phone?: string;
}
```

**Usage:**
```typescript
import type { ContactFormData } from '@/types/forms';

const formData: ContactFormData = {
  name: 'John Doe',
  email: 'john@example.com',
  company: 'Acme Corp',
  message: 'Hello, I am interested in your product.',
  subject: 'Product Inquiry',
  phone: '+1-555-123-4567',
};
```

**Properties:**
- `name`: Contact name (required)
- `email`: Contact email address (required)
- `company`: Company name (optional)
- `message`: Message content (required)
- `subject`: Message subject line (optional)
- `phone`: Contact phone number (optional)

**Use Cases:**
- Contact form submissions
- Lead capture forms
- Customer inquiry forms
- Support request forms

**Validation:**
- Email format validation (handled at runtime with Zod schemas)
- Message length constraints (10-2000 characters, validated at runtime)
- See `@/lib/marketing` for runtime validation schemas

### `ContactFormSubmitData`

Extended contact form data that includes security tokens for form submission. Extends `ContactFormData` with optional Turnstile token for bot protection.

```typescript
export interface ContactFormSubmitData extends ContactFormData {
  turnstileToken?: string;
}
```

**Usage:**
```typescript
import type { ContactFormSubmitData } from '@/types/forms';

const submitData: ContactFormSubmitData = {
  name: 'John Doe',
  email: 'john@example.com',
  message: 'Hello, world!',
  turnstileToken: '0.abcdef...', // Cloudflare Turnstile token
};
```

**Properties:**
- Inherits all properties from `ContactFormData`
- `turnstileToken`: Cloudflare Turnstile verification token (optional, used for bot protection)

**Use Cases:**
- Form submission payloads to API endpoints
- Server-side form processing
- Security-validated form submissions

**Security:**
- Turnstile token is verified server-side before processing
- Token is not stored or logged for security reasons
- See contact form API route for validation implementation

## 🔧 Form Configuration Types

### `ContactFormField`

Interface for configuring individual form fields, including validation rules, display options, and accessibility attributes.

```typescript
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
```

**Usage:**
```typescript
import type { ContactFormField } from '@/types/forms';

const emailField: ContactFormField = {
  key: 'email',
  label: 'Email Address',
  type: 'email',
  required: true,
  placeholder: 'you@example.com',
  helpText: 'We'll never share your email with anyone else.',
  errorText: 'Please enter a valid email address',
  extraDescribedBy: ['email-help', 'email-error'],
};
```

**Properties:**
- `key`: Field key (must be a key of `ContactFormData`)
- `label`: Display label for the field (required)
- `type`: Input type (`"text"`, `"email"`, `"tel"`, `"textarea"`)
- `required`: Whether the field is required (optional, defaults to `false`)
- `placeholder`: Placeholder text for the input (optional)
- `helpText`: Help text displayed below the field (optional)
- `errorText`: Error message to display on validation failure (optional)
- `extraDescribedBy`: Additional ARIA described-by IDs for accessibility (optional)

**Field Types:**
- `"text"`: Standard text input
- `"email"`: Email input with browser validation
- `"tel"`: Telephone number input
- `"textarea"`: Multi-line text area

**Accessibility:**
- `label` is used for accessible form labels
- `helpText` provides additional context for screen readers
- `extraDescribedBy` allows linking to additional descriptive elements
- Error states are properly announced to assistive technologies

### `UseContactFormProps`

Configuration interface for the `useContactForm` hook, defining form fields and submission handler.

```typescript
export interface UseContactFormProps {
  onSubmit?: (data: ContactFormSubmitData) => void | Promise<void>;
  fields: { key: keyof ContactFormData; required?: boolean }[];
}
```

**Usage:**
```typescript
import type { UseContactFormProps } from '@/types/forms';
import { useContactForm } from '@/components/forms/contact/use-contact-form';

const props: UseContactFormProps = {
  onSubmit: async (data) => {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Submission failed');
  },
  fields: [
    { key: 'name', required: true },
    { key: 'email', required: true },
    { key: 'company', required: false },
    { key: 'message', required: true },
  ],
};

const form = useContactForm(props);
```

**Properties:**
- `onSubmit`: Optional callback function called on form submission (can be async)
- `fields`: Array of field configurations defining which fields are included and their required status

**Hook Integration:**
- Used by `useContactForm` hook to configure form behavior
- Field array determines which fields are rendered and validated
- Submit handler receives validated `ContactFormSubmitData`

## 📊 Usage Examples

### Basic Form Data Handling

```typescript
import type { ContactFormData, ContactFormSubmitData } from '@/types/forms';

// Initialize form data
const initialData: ContactFormData = {
  name: '',
  email: '',
  message: '',
};

// Handle form submission
async function handleSubmit(data: ContactFormSubmitData) {
  // Validate turnstile token if present
  if (data.turnstileToken) {
    await validateTurnstileToken(data.turnstileToken);
  }

  // Submit to API
  const response = await fetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  return response.json();
}
```

### Form Field Configuration

```typescript
import type { ContactFormField } from '@/types/forms';

// Configure form fields
const formFields: ContactFormField[] = [
  {
    key: 'name',
    label: 'Full Name',
    type: 'text',
    required: true,
    placeholder: 'Enter your full name',
    helpText: 'This is how we'll address you in our response',
  },
  {
    key: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
    placeholder: 'you@example.com',
    errorText: 'Please enter a valid email address',
  },
  {
    key: 'company',
    label: 'Company',
    type: 'text',
    required: false,
    placeholder: 'Your company name (optional)',
  },
  {
    key: 'phone',
    label: 'Phone Number',
    type: 'tel',
    required: false,
    placeholder: '+1 (555) 123-4567',
  },
  {
    key: 'message',
    label: 'Message',
    type: 'textarea',
    required: true,
    placeholder: 'Tell us how we can help...',
    helpText: 'Please provide details about your inquiry (10-2000 characters)',
    errorText: 'Message must be between 10 and 2000 characters',
  },
];
```

### Hook Integration

```typescript
import type { UseContactFormProps } from '@/types/forms';
import { useContactForm } from '@/components/forms/contact/use-contact-form';

function ContactFormComponent() {
  const props: UseContactFormProps = {
    onSubmit: async (data) => {
      try {
        const response = await fetch('/api/contact', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        });

        if (!response.ok) {
          throw new Error('Failed to submit form');
        }

        // Handle success
        console.log('Form submitted successfully');
      } catch (error) {
        console.error('Form submission error:', error);
        throw error; // Let hook handle error state
      }
    },
    fields: [
      { key: 'name', required: true },
      { key: 'email', required: true },
      { key: 'company', required: false },
      { key: 'message', required: true },
    ],
  };

  const {
    formData,
    handleChange,
    handleSubmit,
    isLoading,
    status,
  } = useContactForm(props);

  // Render form...
}
```

### Type-Safe Form Validation

```typescript
import type { ContactFormData } from '@/types/forms';

// Type-safe field access
function validateForm(data: ContactFormData): string[] {
  const errors: string[] = [];

  if (!data.name.trim()) {
    errors.push('Name is required');
  }

  if (!data.email.trim()) {
    errors.push('Email is required');
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    errors.push('Invalid email format');
  }

  if (!data.message.trim()) {
    errors.push('Message is required');
  } else if (data.message.length < 10) {
    errors.push('Message must be at least 10 characters');
  } else if (data.message.length > 2000) {
    errors.push('Message must be less than 2000 characters');
  }

  return errors;
}
```

## 🎯 Usage Guidelines

### ✅ **Do**
- Import types from `@/types/forms` barrel exports
- Use `ContactFormData` for form state management
- Use `ContactFormSubmitData` for API submission payloads
- Use `ContactFormField` for dynamic form field configuration
- Leverage type safety for form field keys with `keyof ContactFormData`

### ❌ **Don't**
- Don't create duplicate type definitions for form data
- Don't bypass type safety with `any` or type assertions
- Don't import directly from `types.ts` when barrel exports exist
- Don't modify form data types without updating validation schemas

## 🔗 Integration Points

### Form Components
- **Location**: `components/forms/contact/`
- **Usage**: `ContactForm`, `useContactForm` hook
- **Types**: All types from `@/types/forms`

### Form Routes
- **Location**: `app/(marketing)/contact/`
- **Usage**: Contact form page route
- **Types**: `ContactFormSubmitData` for API submissions

### Validation Schemas
- **Location**: `@/lib/marketing`
- **Usage**: Runtime validation with Zod schemas
- **Types**: Types correspond to validation schema structure

### Form Primitives
- **Location**: `components/forms/primitives/`
- **Usage**: Base form field components
- **Types**: `ContactFormField` for field configuration

## 📚 Related Documentation

- [Contact Form Components](../../components/forms/contact/README.md) - Form component implementation
- [Marketing Routes](../../app/(marketing)/README.md) - Marketing pages and forms
- [Form Validation](../../lib/marketing/README.md) - Runtime validation schemas
- [Type System Overview](../../docs/typescript/typescript-guide.md) - Overall type system architecture

## 🏷️ Tags

`#types` `#forms` `#contact-form` `#typescript` `#validation`

---

_Last updated: 2026-01-16 (Created comprehensive forms types documentation)_
