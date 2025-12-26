# Billing Components

Subscription and payment management components.

## Purpose

Provides UI components for managing user subscriptions, billing, and payment information.

## Public Exports

From `components/billing/index.ts`:

- **Subscription**: `SubscriptionClient` - Client component for subscription management UI

## Usage in App Routes

Billing components are used in:

- **Subscription page**: `SubscriptionClient` in `/subscription` route
- **Account settings**: Subscription management in user account pages

## Styling

- **Tailwind CSS**: Primary styling approach
- **CVA Variants**: Component variants in `styles/ui/**`
- **Design Tokens**: Uses CSS custom properties from design system

## Server/Client Notes

- **Client components**: `SubscriptionClient` requires client-side interactivity for subscription management
