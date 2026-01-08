import type { VariantProps } from '@/styles';
import { tv } from '@/styles';

/**
 * contactFormVariants
 * -------------------
 * Layout recipe for the `<ContactForm>` organism.
 * Supports different layouts, sizes, and status states.
 */
const contactFormVariants = tv({
  slots: {
    container: ['space-y-6'],
    header: ['space-y-2'],
    title: ['text-2xl font-semibold text-foreground'],
    description: ['text-sm text-muted-foreground'],
    statusMessage: ['rounded-lg p-4 text-sm'],
    successMessage: [
      'bg-success-subtle text-success',
      'border border-success-subtle',
    ],
    errorMessage: [
      'bg-destructive-subtle text-destructive',
      'border border-destructive-subtle',
    ],
    fieldsContainer: ['space-y-6'],
    fieldGroup: ['space-y-2'],
    fieldLabel: ['text-sm font-medium'],
    fieldInputContainer: ['relative'],
    fieldIcon: ['absolute text-muted-foreground'],
    textareaIcon: ['left-3 top-3 h-md w-md'],
    inputIcon: ['left-3 top-1/2 h-md w-md -translate-y-1/2'],
    input: ['transition-colors duration-200'],
    inputWithIcon: ['pl-10'],
    textarea: ['min-h-32 transition-colors duration-200'],
    textareaWithIcon: ['pl-10 pt-3'],
    submitButton: ['w-full gap-2 transition-all duration-200'],
  },
  variants: {
    layout: {
      default: {},
      compact: {
        container: 'space-y-4',
        fieldsContainer: 'space-y-4',
        fieldGroup: 'space-y-xs',
      },
      spacious: {
        container: 'space-y-8',
        fieldsContainer: 'space-y-8',
        fieldGroup: 'space-y-4',
      },
    },
    size: {
      sm: {
        title: 'text-lg',
        description: 'text-xs',
        fieldLabel: 'text-xs',
        statusMessage: 'text-xs p-3',
      },
      md: {
        title: 'text-2xl',
        description: 'text-sm',
        fieldLabel: 'text-sm',
        statusMessage: 'text-sm p-4',
      },
      lg: {
        title: 'text-3xl',
        description: 'text-base',
        fieldLabel: 'text-base',
        statusMessage: 'text-base p-5',
      },
    },
    variant: {
      default: {},
      minimal: {
        container: 'space-y-4',
        title: 'text-xl',
        statusMessage: 'border-0 bg-transparent p-2',
      },
      card: {
        container: ['rounded-xl border border-border bg-surface p-6 shadow-sm', 'space-y-6'],
      },
      inline: {
        fieldsContainer: 'grid grid-cols-1 gap-4 md:grid-cols-2',
        submitButton: 'md:col-span-2',
      },
    },
  },
  defaultVariants: {
    layout: 'default',
    size: 'md',
    variant: 'default',
  },
});

export type ContactFormVariantProps = VariantProps<typeof contactFormVariants>;

export { contactFormVariants };

