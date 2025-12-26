# Forms Components

Form components and form handling utilities.

## Purpose

Provides reusable form components and form state management hooks for user input and validation.

## Public Exports

From `components/forms/index.ts`:

- **Forms**: `ContactForm` - Contact form with validation
- **Hooks**: `useContactForm` - Form state management hook

## Usage in App Routes

Form components are used in:

- **Contact page**: `ContactForm` in `/contact` route
- **Marketing pages**: Contact forms in marketing sections

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/organisms/**` (contact form variants)
- **Design Tokens**: Uses CSS custom properties from design system

## Server/Client Notes

- **Client components**: `ContactForm` requires client-side interactivity (`"use client"` directive)
- **Form validation**: Uses Zod schemas for runtime validation
- **Environment config**: Uses `publicEnv` from `@/lib/shared` for client-safe configuration

## Related

- Form primitives and field renderers are internal implementation details
- Validation schemas live in `@/lib/validators` and `@/types/forms`
