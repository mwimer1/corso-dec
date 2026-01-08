---
title: "Chat"
last_updated: "2026-01-07"
category: "library"
status: "active"
description: "Chat processing utilities for AI chat interface."
---
# Chat

Chat processing utilities for AI chat interface.

## Runtime

**Runtime**: universal ⚠️

*No runtime-specific signals detected (likely universal/isomorphic)*

**Signals detected:**
- No runtime signals detected

## Directory Structure

```
lib/chat/
├── client/
│   ├── mock-stream.ts
│   └── process.ts
├── query/
│   └── intent-detection.ts
├── rag-context/
│   └── history-client.ts
├── types/
│   └── client-safe.ts
├── index.ts
```

## Public API

**Value exports** from `@/lib/chat`:

- `clearLocalChatHistory`
- `detectQueryIntentWithCache`
- `inferTableIntent`
- `loadRecentChatHistory`
- `processUserMessageStreamClient`
- `saveChatHistory`

**Type exports** from `@/lib/chat`:

- `SQLStreamChunk` (type)

## Usage

```typescript
import { clearLocalChatHistory } from '@/lib/chat';
```

```typescript
import type { SQLStreamChunk } from '@/lib/chat';
```

