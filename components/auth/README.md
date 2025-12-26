# Auth Components

Authentication UI components and Clerk integration helpers.

## Purpose

Provides authentication-related components for sign-in, sign-up, and session management using Clerk.

## Public Exports

From `components/auth/index.ts`:

- **Layout**: `AuthNavbar`, `AuthShell`, `ClerkLoading`
- **Widgets**: `ClerkEventsHandler`

## Usage in App Routes

Auth components are used in:

- **Sign-in/Sign-up**: `AuthShell`, `AuthNavbar` in `/sign-in`, `/sign-up` routes
- **Session management**: `ClerkEventsHandler` for handling Clerk events
- **Loading states**: `ClerkLoading` for authentication state transitions

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/**`
- **Design Tokens**: Uses CSS custom properties from design system

## Server/Client Notes

- **Client components**: `ClerkEventsHandler` (requires client-side event handling)
- **Server-safe**: `AuthShell`, `AuthNavbar` (can be server components)

## Internal-Only

The `components/auth/internal` directory contains internal helpers used by auth providers and should not be imported directly from application code. These are used internally by the auth layout components.
