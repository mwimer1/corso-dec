# Shared Utilities

Non-UI shared utilities, validation, configuration, and types.

## Purpose

Contains client-safe utilities that don't depend on React or UI frameworks. These are pure functions, validation schemas, configuration helpers, and type definitions that can be used in both client and server contexts.

## Structure

- **Validation**: Zod schemas and validation utilities
- **Configuration**: Client-safe config helpers
- **Types**: Shared type definitions
- **Utilities**: Pure functions and helpers

## Guidelines

- **No React hooks** - React hooks belong in `components/ui/hooks/` or domain-specific hook locations
- **No UI-specific code** - UI components and utilities belong in `components/ui/`
- **Client-safe only** - All exports must be safe for client-side use
- **Pure functions preferred** - Avoid side effects where possible

## Related

- **UI Hooks**: `components/ui/hooks/` - React hooks for UI components
- **UI Utilities**: `components/ui/shared/` - UI-specific utilities
- **Server Utilities**: `lib/server/` - Server-only code

## Usage

```typescript
// Validation
import { validateUserMessage } from '@/lib/shared/validators';

// Configuration
import { publicEnv } from '@/lib/shared/config';

// Types
import type { ChatMessage } from '@/types/chat';
```

---

_Last updated: 2025-01-03_
