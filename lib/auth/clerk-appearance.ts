// lib/auth/clerk-appearance.ts
// Edge-safe, client-safe: strings only, no server imports.
// Use proper Clerk types for better type safety.

/**
 * Type-safe Clerk appearance configuration
 * Defined here to avoid importing @clerk/types which may not be available in all environments
 */
interface ClerkAppearanceConfig {
  variables?: Record<string, string>;
  elements?: Record<string, string>;
  layout?: Record<string, unknown>;
}

/**
 * Token-mapped "light" appearance for Clerk.
 * Uses your Tailwind + CSS variables utility classes to render a light UI
 * without requiring { light } from '@clerk/themes'.
 */
export const clerkAppearanceLight: Partial<ClerkAppearanceConfig> = {
  variables: {
    // Map to design tokens — stays framework-agnostic and Edge-safe.
    colorBackground: 'hsl(var(--surface))',
    colorText: 'hsl(var(--foreground))',
    colorPrimary: 'hsl(var(--primary))',
    colorInputBackground: 'hsl(var(--surface))',
    colorAlphaShade: 'hsl(var(--border))',
    colorNeutral: 'hsl(var(--text-medium))',
    borderRadius: 'var(--radius-card)',
    fontFamily: 'var(--font-sans)',
  },
  elements: {
    // Card container for SignIn/SignUp/Org widgets
    // KEEP LIGHT MODE even when root <html> has `dark`
    card:
      'bg-surface text-foreground dark:bg-surface dark:text-foreground border border-border shadow-[var(--shadow-card)]',
    headerTitle: 'text-2xl font-semibold text-foreground',
    headerSubtitle: 'text-sm text-muted-foreground',
    main: 'gap-6',

    // Inputs
    formFieldLabel: 'text-sm text-foreground',
    formFieldInput:
      'bg-surface text-foreground border border-border placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40',
    formFieldInput__password:
      'bg-surface text-foreground border border-border placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/40',
    formFieldSuccessText: 'text-success',
    formFieldErrorText: 'text-destructive',

    // Primary CTA
    formButtonPrimary:
      'bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/40',

    // Social buttons
    socialButtons: 'gap-2',
    socialButtonsBlockButton:
      'bg-surface border border-border hover:bg-surface/80',

    // Divider
    dividerLine: 'bg-border',
    dividerText: 'text-muted-foreground',

    // Footer (Sign up link + "Secured by / Development mode")
    footer: 'bg-surface text-foreground dark:bg-surface dark:text-foreground',
    footerActionText: 'text-muted-foreground',
    footerActionLink: 'text-primary hover:opacity-90',
  },
};

/**
 * Type-safe Clerk appearance configuration - re-export for convenience
 */
export type ClerkAppearance = ClerkAppearanceConfig;



