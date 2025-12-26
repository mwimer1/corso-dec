# Hooks

React hooks for the Corso application.

## Current State

All hooks have been moved to their domain homes:

- **UI Hooks**: `components/ui/hooks/`
  - `use-subscription-status.ts` - Subscription status hook
  - `use-arrow-key-navigation.ts` - Keyboard navigation utilities

- **Chat Hooks**: `components/chat/hooks/`
  - `use-chat.ts` - Chat functionality hook

- **Domain-Specific Hooks**: Located in their respective component directories
  - `components/landing/hooks/use-animated-number.ts`
  - `components/insights/hooks/use-article-analytics.ts`

## Usage

```typescript
// UI hooks
import { useSubscriptionStatus } from '@/components/ui/hooks/use-subscription-status';
import { useArrowKeyNavigation } from '@/components/ui/hooks/use-arrow-key-navigation';

// Chat hooks
import { useChat } from '@/components/chat/hooks/use-chat';

// Via barrel exports
import { useSubscriptionStatus, useArrowKeyNavigation } from '@/components/ui/shared';
import { useChat } from '@/components/chat';
```

## Organization Principles

- **Domain-colocated**: Hooks live with the components that use them
- **Shared UI hooks**: Common UI hooks in `components/ui/hooks/`
- **No top-level hooks/**: All hooks have been moved to their domain homes

## Related Documentation

- [Warehouse Query Hooks](../../docs/analytics/warehouse-query-hooks.md) - Data fetching patterns
- [Component Patterns](../../components/README.md) - UI component organization

---

_Last updated: 2025-01-29_
