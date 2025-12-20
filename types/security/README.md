---
title: "types/security"
last_updated: "2025-12-15"
category: "automation"
---

# Security Types

Type definitions for security policies, rules, and related security features.

## Import Patterns

**Prefer direct imports** from the specific type file:

```typescript
// ✅ Preferred: Direct imports
import type { SecurityPolicy, SecurityRule } from '@/types/security/policy/types';
```

## Available Types

- `types/security/policy/types.ts` - Security policy and rule definitions
  - `SecurityPolicy` - Security policy configuration
  - `SecurityRule` - Individual security rule definition

## Note on Prompt Guard Types

Prompt guard types were previously located here but have been removed as dead code. If you need prompt guard functionality, check the security implementation in `lib/security/`.
