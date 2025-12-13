---
category: "documentation"
last_updated: "2025-12-13"
status: "draft"
---
# Barrels Policy (Manual, Selective, Runtime-Aware)

## Overview

Barrels (`index.ts` files) are **manual** and **selective**. Never auto-generate `export *` for all files in a folder. Barrels are created **only** where cross-domain imports are needed and must respect runtime boundaries.

## Key Principles

- **Manual Creation**: Barrels are created manually with careful consideration of what to export
- **Selective Exports**: Use named exports rather than blanket `export *`
- **Runtime Awareness**: Client-safe barrels must **not** re-export `server-only` modules (`*/server/*`)
- **Cross-Domain Only**: Create barrels only where imports span domain boundaries
- **ESLint Enforcement**: Use `pnpm barrels:policy:check` to ensure no server-only re-exports

## When to Create a Barrel

Create a barrel when:
- Multiple domains need to import from the same set of modules
- You want to provide a stable public API surface
- Cross-domain imports would otherwise require deep paths

Do NOT create a barrel for:
- Internal domain organization (use relative imports)
- Auto-generated convenience (violates selective export principle)

## Runtime Boundary Enforcement

### Server-Only Restrictions

Barrels that are imported by client/edge code **MUST NOT** re-export server-only modules:

```typescript
// ❌ BAD: Server-only export in client-safe barrel
export * from './server/auth-helpers'; // Leaks server code to client bundles

// ✅ GOOD: Selective exports, runtime-aware
export * from './client/auth-helpers'; // Client-safe
// Server helpers imported directly where needed
```

### ESLint Guards

Client/edge code cannot import server-only modules:

```json
{
  "overrides": [
    {
      "files": ["app/**/*.{ts,tsx}", "components/**/*.{ts,tsx}"],
      "rules": {
        "no-restricted-imports": [
          "error",
          {
            "patterns": [
              {
                "group": ["@/lib/server/**"],
                "message": "Server-only code must not be imported in client/edge components."
              },
              {
                "group": ["@/lib/**/server/**"],
                "message": "Server-only code must not be imported in client/edge components."
              }
            ]
          }
        ]
      }
    }
  ]
}
```

## Policy Enforcement

Run `pnpm barrels:policy:check` to validate that no barrels re-export server-only code.

## Examples

### Good Barrels

```typescript
// lib/auth/index.ts - Selective, runtime-aware
/**
 * Client-safe authentication helpers
 */
export * from './client/auth-helpers';
export * from './authorization/roles'; // Client-safe types

/**
 * Server-only utilities are NOT exported here
 * Import from '@/lib/auth/server' directly in server contexts
 */

// lib/chat/index.ts - Minimal public API
// Public surface for cross-domain imports only.
// Keep minimal. Do not re-export internal helpers here unless needed by other domains.

// History management utilities (client-safe)
export { clearLocalChatHistory, loadRecentChatHistory, saveChatHistory } from './rag-context/history-client';

// Client-side chat processing
export { processUserMessageStreamClient } from './client/process';

// Query utilities
export { detectQueryIntentWithCache, inferTableIntent } from './query/intent-detection';

// Client-safe types
export type { SQLStreamChunk } from './types/client-safe';

// Server-only features are NOT exported here to avoid leaking server code into client bundles.
// Import server-only helpers directly where needed.
```

### Bad Barrels

```typescript
// ❌ Auto-generated blanket exports
export * from './auth-helpers';
export * from './server-only-utils'; // Leaks server code
export * from './internal-helpers'; // Not needed publicly
export * from './deprecated-code'; // Shouldn't be exported

// ❌ Unnecessary barrels for internal organization
// components/ui/atoms/index.ts
export * from './button';
export * from './input';
// Use relative imports instead: import { Button } from './button'
```

## Migration Notes

When creating new barrels:
1. Review all modules in the directory
2. Determine which are truly public API
3. Check runtime compatibility (server vs client)
4. Add documentation comments explaining boundaries
5. Run `pnpm barrels:policy:check` to validate

## Related Rules

- `corso/no-cross-domain-imports`: Enforces domain boundaries
- `corso/no-deep-imports`: Prevents deep imports that should use barrels
- ESLint `no-restricted-imports`: Prevents client importing server-only code

