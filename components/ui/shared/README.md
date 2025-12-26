# UI Shared

Shared utilities and helpers for UI components.

## Purpose

Provides shared utilities, analytics tracking, and helper functions used across UI components.

## Public Exports

From `components/ui/shared/index.ts`:

- **Analytics**: Analytics tracking utilities (re-exported from `./analytics`)

## Usage in App Routes

Shared utilities are used throughout the application:

- **Analytics tracking**: Navigation clicks, user interactions across all routes
- **Component utilities**: Shared helpers for UI component logic

## Styling

Shared utilities don't provide styling - they are utility functions and helpers.

## Server/Client Notes

- **Client-only**: Analytics tracking utilities are client-only (require `window` object)
- **Edge-safe**: Utilities are designed to be edge-compatible where possible
- **Graceful degradation**: Analytics failures never break user experience

## Analytics

The analytics module provides:
- `trackNavClick` - Navigation click tracking
- `trackEvent` - Generic event tracking
- Provider integration (Segment, Google Analytics 4)
- Privacy-aware tracking with consent management

See `@/lib/shared/analytics/track` for the canonical analytics implementation.
