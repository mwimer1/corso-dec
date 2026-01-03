/**
 * This is the only Tailwind config; fallbacks must match token defaults exactly.
 * 
 * Token contract: CSS tokens in styles/tokens/*.css are canonical.
 * Tailwind config fallbacks (var(--token, fallback)) must match token defaults
 * to prevent "two sources of truth" configuration drift.
 * 
 * Validation: Run `pnpm check:tokens` to enforce this contract.
 */
import typography from '@tailwindcss/typography';
import type { Config } from 'tailwindcss';
import animate from 'tailwindcss-animate';
import { BREAKPOINT } from './styles/breakpoints';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './styles/**/*.{js,ts,jsx,tsx}',
    './hooks/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: ['class'],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    // Align Tailwind screens to the BREAKPOINT tokens (single source of truth)
    screens: Object.fromEntries(
      Object.entries(BREAKPOINT).map(([key, value]) => [key, `${value}px`])
    ),
    extend: {
      colors: {
        // Design token mapping - unified primary as brand blue
        primary: {
          DEFAULT: 'hsl(var(--primary, 221 86% 54%))',
          foreground: 'hsl(var(--primary-foreground, 0 0% 98%))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary, 221 86% 90%))',
          foreground: 'hsl(var(--secondary-foreground, 222.2 47.4% 11.2%))',
        },
        background: 'hsl(var(--background, 0 0% 100%))',
        showcase: 'hsl(var(--showcase-background, 0 0% 99.2%))',
        foreground: 'hsl(var(--foreground, 222.2 47.4% 11.2%))',
        surface: {
          DEFAULT: 'hsl(var(--surface, 0 0% 100%))',
          contrast: 'hsl(var(--surface-contrast, 0 0% 93%))',
          hover: 'hsl(var(--surface-hover, 0 0% 93%))',
          selected: 'hsl(var(--surface-selected, 221.2 83.2% 95%))',
        },
        border: 'hsl(var(--border, 214.3 31.8% 89%))',
        'border-subtle': 'hsl(var(--border-subtle, 214.3 31.8% 96%))',
        input: 'hsl(var(--input, 214.3 31.8% 91.4%))',
        ring: 'hsl(var(--ring, 221.2 83.2% 53.3%))',
        // Text hierarchy
        text: {
          high: 'hsl(var(--text-high, 222.2 47.4% 11.2%))',
          medium: 'hsl(var(--text-medium, 240 5% 25%))',
          low: 'hsl(var(--text-low, 215.4 16.3% 46.9%))',
        },
        // Semantic colors
        success: {
          DEFAULT: 'hsl(var(--success, 142.1 70.6% 35%))',
          foreground: 'hsl(var(--success-foreground, 0 0% 100%))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning, 37.7 92.1% 50.2%))',
          foreground: 'hsl(var(--warning-foreground, 222.2 47.4% 11.2%))',
        },
        danger: {
          DEFAULT: 'hsl(var(--danger, 0 84.2% 50%))',
          foreground: 'hsl(var(--danger-foreground, 0 0% 98%))',
        },
        // Alias: unify destructive/error to danger tokens
        destructive: {
          DEFAULT: 'hsl(var(--danger, 0 84.2% 50%))',
          foreground: 'hsl(var(--danger-foreground, 0 0% 98%))',
        },
        error: {
          DEFAULT: 'hsl(var(--danger, 0 84.2% 50%))',
          foreground: 'hsl(var(--danger-foreground, 0 0% 98%))',
        },
        info: {
          DEFAULT: 'hsl(var(--info, 217.2 91.2% 59.8%))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted, 0 0% 96%))',
          foreground: 'hsl(var(--muted-foreground, 215.4 16.3% 46.9%))',
        },
        // Legacy color mappings for backward compatibility
        card: {
          DEFAULT: 'hsl(var(--surface, 0 0% 100%))',
          foreground: 'hsl(var(--foreground, 222.2 47.4% 11.2%))',
        },
        popover: {
          DEFAULT: 'hsl(var(--surface, 0 0% 100%))',
          foreground: 'hsl(var(--foreground, 222.2 47.4% 11.2%))',
        },
        accent: {
          DEFAULT: 'hsl(var(--secondary, 221 86% 90%))',
          foreground: 'hsl(var(--secondary-foreground, 222.2 47.4% 11.2%))',
        },
      },
      borderRadius: {
        // Design token mapping for radius
        'none': 'var(--radius-none, 0px)',
        'sm': 'var(--radius-sm, 0.125rem)',
        'base': 'var(--radius-base, 0.25rem)',
        'md': 'var(--radius-md, 0.375rem)',
        'lg': 'var(--radius-lg, 0.5rem)',
        'xl': 'var(--radius-xl, 0.75rem)',
        '2xl': 'var(--radius-2xl, 1rem)',
        '3xl': 'var(--radius-3xl, 1.5rem)',
        'full': 'var(--radius-full, 9999px)',
        'button': 'var(--radius-button, 0.625rem)',
        // Legacy mapping
        DEFAULT: 'var(--radius-md, 0.375rem)',
      },
      fontFamily: {
        sans: [
          'var(--font-sans, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif)',
        ],
        mono: ['var(--font-mono, ui-monospace, sfmono-regular, "SF Mono", consolas, "Liberation Mono", menlo, monospace)'],
      },
      fontSize: {
        // Design token mapping for typography
        'xs': 'var(--text-xs, 0.75rem)',
        'sm': 'var(--text-sm, 0.875rem)',
        'base': 'var(--text-base, 1rem)',
        'lg': 'var(--text-lg, 1.125rem)',
        'xl': 'var(--text-xl, 1.25rem)',
        '2xl': 'var(--text-2xl, 1.5rem)',
        '3xl': 'var(--text-3xl, 1.875rem)',
        '4xl': 'var(--text-4xl, 2.25rem)',
        '5xl': 'var(--text-5xl, 3rem)',
        '6xl': 'var(--text-6xl, 3.75rem)',
        '7xl': 'var(--text-7xl, 4rem)',
        '8xl': 'var(--text-8xl, 4.75rem)',
        '9xl': 'var(--text-9xl, 5.25rem)',
      },
      spacing: {
        // Design token mapping for spacing
        'xxs': 'var(--space-xxs, 0.125rem)',
        'xs': 'var(--space-xs, 0.25rem)',
        'sm': 'var(--space-sm, 0.5rem)',
        'ms': 'var(--space-ms, 0.75rem)',
        'md': 'var(--space-md, 1rem)',
        'ml': 'var(--space-ml, 1.25rem)',
        'lg': 'var(--space-lg, 1.5rem)',
        'xl': 'var(--space-xl, 2rem)',
        '2xl': 'var(--space-2xl, 2.5rem)',
        '3xl': 'var(--space-3xl, 3rem)',
        '4xl': 'var(--space-4xl, 4rem)',
        '5xl': 'var(--space-5xl, 5rem)',
        '6xl': 'var(--space-6xl, 6rem)',
        '16xl': 'var(--space-16xl, 16rem)',
        // Additional spacing values
        '9': 'var(--space-9, 2.25rem)',
        '1.5': 'var(--space-1-5, 0.375rem)',
        '2.5': 'var(--space-2-5, 0.625rem)',
        '4px': 'var(--space-4px, 4px)',
        // Component-specific sizing tokens
        'menu-min': 'var(--menu-min-width, 12rem)',
        'menu-min-sm': 'var(--menu-min-width-sm, 8rem)',
      },
      boxShadow: {
        // Design token mapping for shadows
        'xs': 'var(--shadow-xs, 0 1px 2px 0 rgb(0 0 0 / 5%))',
        'sm': 'var(--shadow-sm, 0 1px 3px 0 rgb(0 0 0 / 10%), 0 1px 2px -1px rgb(0 0 0 / 10%))',
        'md': 'var(--shadow-md, 0 4px 6px -1px rgb(0 0 0 / 10%), 0 2px 4px -1px rgb(0 0 0 / 6%))',
        'lg': 'var(--shadow-lg, 0 10px 15px -3px rgb(0 0 0 / 10%), 0 4px 6px -2px rgb(0 0 0 / 5%))',
        'xl': 'var(--shadow-xl, 0 20px 25px -5px rgb(0 0 0 / 10%), 0 8px 10px -5px rgb(0 0 0 / 4%))',
        // Additive tokenized shadows
        'card': 'var(--shadow-card, 0 8px 24px hsl(var(--foreground) / 6%))',
        'elevated': 'var(--shadow-elevated, 0 12px 32px hsl(var(--foreground) / 8%))',
      },
      transitionDuration: {
        // Design token mapping for animation
        '75': 'var(--duration-75, 75ms)',
        '100': 'var(--duration-100, 100ms)',
        '150': 'var(--duration-150, 150ms)',
        '200': 'var(--duration-200, 200ms)',
        '300': 'var(--duration-300, 300ms)',
        '500': 'var(--duration-500, 500ms)',
        '700': 'var(--duration-700, 700ms)',
        '1000': 'var(--duration-1000, 1000ms)',
      },
      transitionDelay: {
        '75': 'var(--delay-75, 75ms)',
        '100': 'var(--delay-100, 100ms)',
        '150': 'var(--delay-150, 150ms)',
        '200': 'var(--delay-200, 200ms)',
        '300': 'var(--delay-300, 300ms)',
        '500': 'var(--delay-500, 500ms)',
        '700': 'var(--delay-700, 700ms)',
        '1000': 'var(--delay-1000, 1000ms)',
      },
      transitionTimingFunction: {
        'ease': 'var(--easing-ease, cubic-bezier(0.4, 0, 0.2, 1))',
        'ease-in': 'var(--easing-ease-in, cubic-bezier(0.4, 0, 1, 1))',
        'ease-out': 'var(--easing-ease-out, cubic-bezier(0, 0, 0.2, 1))',
        'ease-in-out': 'var(--easing-ease-in-out, cubic-bezier(0.4, 0, 0.2, 1))',
        'linear': 'var(--easing-linear, linear)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in var(--duration-md, 300ms) ease-out both',
        'fade-up': 'fade-up var(--duration-md, 300ms) ease-out both',
        'fadeIn': 'fade-in 200ms ease-out',
      },
      animationDuration: {
        '75': 'var(--duration-75, 75ms)',
        '100': 'var(--duration-100, 100ms)',
        '150': 'var(--duration-150, 150ms)',
        '200': 'var(--duration-200, 200ms)',
        '300': 'var(--duration-300, 300ms)',
        '500': 'var(--duration-500, 500ms)',
        '700': 'var(--duration-700, 700ms)',
        '1000': 'var(--duration-1000, 1000ms)',
        'xs': 'var(--duration-xs, 75ms)',
        'sm': 'var(--duration-sm, 150ms)',
        'md': 'var(--duration-md, 300ms)',
        'lg': 'var(--duration-lg, 500ms)',
        'xl': 'var(--duration-xl, 700ms)',
        '2xl': 'var(--duration-2xl, 1000ms)',
      },
      animationDelay: {
        '75': 'var(--delay-75, 75ms)',
        '100': 'var(--delay-100, 100ms)',
        '150': 'var(--delay-150, 150ms)',
        '200': 'var(--delay-200, 200ms)',
        '300': 'var(--delay-300, 300ms)',
        '500': 'var(--delay-500, 500ms)',
        '700': 'var(--delay-700, 700ms)',
        '1000': 'var(--delay-1000, 1000ms)',
        'xs': 'var(--delay-xs, 75ms)',
        'sm': 'var(--delay-sm, 150ms)',
        'md': 'var(--delay-md, 300ms)',
        'lg': 'var(--delay-lg, 500ms)',
        'xl': 'var(--delay-xl, 700ms)',
        '2xl': 'var(--delay-2xl, 1000ms)',
      },
    },
  },
  plugins: [
    animate,
    typography,
    // Note: @tailwindcss/forms not installed - add when needed: pnpm add -D @tailwindcss/forms
  ],
} satisfies Config;

export default config;

