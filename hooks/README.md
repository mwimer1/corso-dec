# Hooks

React hooks for the Corso application.

## Structure

Active hooks are organized as follows:

- **`hooks/shared/`** - Shared React hooks used across domains
  - `ui/use-arrow-key-navigation.ts` - Keyboard navigation utilities
  - Note: `use-subscription-status` moved to `components/ui/hooks/use-subscription-status.ts`

- **`hooks/chat/`** - (Moved to `components/chat/hooks/`)
  - Chat hooks have been relocated to `components/chat/hooks/use-chat.ts`

## Future Organization

Domain-specific hooks should be moved to their respective domain locations:
- Dashboard hooks → `lib/dashboard/hooks/` or `components/dashboard/hooks/`
- Integration hooks → `lib/integrations/hooks/`
- Marketing hooks → `lib/marketing/hooks/` or `components/marketing/hooks/`
- Security hooks → `lib/security/hooks/`

This consolidation will improve discoverability and reduce directory sprawl.

## Usage

```typescript
// UI hooks (moved to components/ui/hooks/)
import { useSubscriptionStatus } from '@/components/ui/hooks/use-subscription-status';

// Shared hooks
import { useArrowKeyNavigation } from '@/hooks/shared/ui';

// Chat hooks (moved to components/chat/hooks/)
import { useChat } from '@/components/chat';
```

## Related Documentation

- [Warehouse Query Hooks](../../docs/analytics/warehouse-query-hooks.md) - Data fetching patterns
- [Component Patterns](../../components/README.md) - UI component organization

---

_Last updated: 2025-01-03_
