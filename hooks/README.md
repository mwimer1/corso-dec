# Hooks

React hooks for the Corso application.

## Current State

Most hooks have been moved to their domain homes. Shared cross-cutting hooks remain in `hooks/shared/`:

- **Shared Hooks**: `hooks/shared/`
  - `ui/use-arrow-key-navigation.ts` - Keyboard navigation utilities (exported via `hooks/shared`)

- **UI Hooks**: `components/ui/hooks/`
  - `use-subscription-status.ts` - Subscription status hook

- **Chat Hooks**: `components/chat/hooks/`
  - `use-chat.ts` - Chat functionality hook

- **Domain-Specific Hooks**: Located in their respective component directories
  - `components/landing/hooks/use-animated-number.ts`
  - `components/insights/hooks/use-article-analytics.ts`

## Usage

```typescript
// Shared hooks
import { useArrowKeyNavigation } from '@/hooks/shared';

// UI hooks
import { useSubscriptionStatus } from '@/components/ui/hooks/use-subscription-status';

// Chat hooks
import { useChat } from '@/components/chat/hooks/use-chat';

// Via barrel exports (where available)
import { useChat } from '@/components/chat';
```

## Organization Principles

- **Domain-colocated**: Most hooks live with the components that use them
- **Shared hooks**: Cross-cutting hooks (like navigation utilities) remain in `hooks/shared/`
- **UI hooks**: Component-specific UI hooks in `components/ui/hooks/`
- **Minimal top-level hooks/**: Only shared, cross-cutting hooks remain in `hooks/shared/`

## Related Documentation

- [Warehouse Query Hooks](../../docs/analytics/warehouse-query-hooks.md) - Data fetching patterns
- [Component Patterns](../../components/README.md) - UI component organization

---

_Last updated: 2025-01-29_
