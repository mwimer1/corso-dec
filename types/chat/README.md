---
title: "types/chat"
last_updated: "2025-12-15"
category: "automation"
---

# Chat Types

Type definitions for chat messages, queries, and responses.

## Import Patterns

**Prefer direct imports** from the specific type file. While `types/chat/index.ts` barrel exists, direct imports are recommended to prevent circular dependencies.

```typescript
// ✅ Preferred: Direct imports
import type { ChatMessage } from '@/types/chat/message/types';
import type { QueryIntent, TableIntent } from '@/types/chat/query/types';
import type { ChartConfig, ChatStreamChunk } from '@/types/chat/response/types';
```

### ⚠️ Barrel Available (but discouraged)

```typescript
// ⚠️ Barrel exists but direct imports preferred
import type { ChatMessage } from '@/types/chat';
```

## Available Types

- `types/chat/message/types.ts` - Chat message types (ChatMessage, ColumnDef, VisualizationType)
- `types/chat/query/types.ts` - Query types (QueryIntent, QueryIntentDetection, TableIntent, BuildSqlPrompt, ChatQueryResult, NLtoSQLResult, QueryFilter)
- `types/chat/response/types.ts` - Response types (ChartConfig, ChatStreamChunk)
