---
description: "Documentation and resources for documentation functionality. Located in ai/rules/."
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
title: "Rules"
---
# Dashboard Components - Extended Documentation

This document contains detailed chat implementation patterns and extended component examples. For the concise rule, see [`.cursor/rules/dashboard-components.mdc`](../../../.cursor/rules/dashboard-components.mdc).

## Chat Implementation Details

### Chat Navigation & State Management

**New Chat Clearing Pattern:**
- The sidebar "Chat" link automatically adds `?new=true` query parameter to `/dashboard/chat`
- When `ChatWindow` detects `?new=true` in the URL, it automatically calls `clearChat()` from the `useChat` hook
- `clearChat()` clears both the React state and localStorage, ensuring a fresh chat state
- This allows users to start a new chat session by clicking the Chat link in the sidebar, even when already on the chat page

**Implementation Pattern:**
```typescript
// In ChatWindow component
const { clearChat } = useChat({ ... });

// Clear chat when ?new=true is in URL (e.g., when clicking Chat in sidebar)
useEffect(() => {
  const isNewChat = searchParams?.get('new') === 'true';
  if (isNewChat) {
    clearChat();
  }
}, [searchParams, clearChat]);
```

**Key Files:**
- `components/chat/sections/chat-window.tsx` - Detects `?new=true` and calls `clearChat()`
- `components/chat/hooks/use-chat.ts` - Provides `clearChat()` function
- `components/dashboard/layout/dashboard-sidebar.tsx` - Adds `?new=true` to chat href

### ChatWindow Props (Additive)

```typescript
interface ChatWindowProps {
  // Optional props for backward compatibility
  showHeader?: boolean;           // Shows compact header bar
  headerTitle?: string;           // Header title text
  onToggleContext?: () => void;   // Callback for context toggle
  onSuggestionClick?: (label: string) => void; // Fired when suggestion chip clicked
  showTypingLine?: boolean;       // Subtle typing line below the list
}
```

### ChatDock Props (Additive)

```typescript
interface ChatDockProps {
  // Same optional props as ChatWindow
  showHeader?: boolean;
  headerTitle?: string;
  onToggleContext?: () => void;
  onSuggestionClick?: (label: string) => void;
  showTypingLine?: boolean;
}
```

### Chat Accessibility

```typescript
// ✅ CORRECT: Proper ARIA implementation
<ChatDock 
  role="complementary" 
  aria-label="Data assistant"
>
  <input 
    aria-label="Chat message input"
    placeholder="Ask about your data..."
  />
  <button aria-label="Send message">Send</button>
</ChatDock>
```

## Table Components - Extended Patterns

### Filter Mapping

```typescript
// ✅ CORRECT: Type-safe filter mapping
interface FilterMapping {
  numberRange: { op: 'between', value: [number, number] };
  dateRange: { op: 'between', value: [Date, Date] };
  boolean: { op: 'bool', value: boolean };
  // Others default to 'eq'
  [key: string]: { op: string, value: any };
}

// ❌ INCORRECT: SQL string interpolation
// const sql = `SELECT * FROM table WHERE status = '${status}'`;

// ✅ CORRECT: Parameterized queries
const sql = 'SELECT * FROM table WHERE status = ?';
const params = [status];
```

### Column Renderers

```typescript
// ✅ CORRECT: Client-side renderer attachment
const columns = [
  {
    key: 'status',
    title: 'Status',
    meta: {
      renderer: (value: string) => <StatusBadge status={value} />
    }
  }
];

// ❌ INCORRECT: Passing functions from server to client
// const serverFunction = () => { /* server logic */ };
```

### Entity Data Helpers

```typescript
// ✅ CORRECT: Server-side entity helpers
import { getEntityPage } from '@/lib/entities/pages';

export async function EntityPage({ entity }: { entity: string }) {
  const data = await getEntityPage(entity, { page: { index: 0, size: 50 } });
  return <EntityListPage data={data} />;
}
```

## Testing & Validation

### Component Testing

```typescript
// Test chat components
import { render, screen } from '@testing-library/react';
import { ChatWindow } from '@/components/dashboard/chat/chat-window';

test('chat window renders with optional props', () => {
  render(
    <ChatWindow 
      showHeader={true}
      headerTitle="Test Chat"
      onToggleContext={jest.fn()}
    />
  );
  
  expect(screen.getByText('Test Chat')).toBeInTheDocument();
});
```

### Table Testing

```typescript
// Test table components
import { DashboardTable } from '@/components/dashboard';

test('table respects filter boundaries', () => {
  const filters = {
    status: { op: 'eq', value: 'active' },
    dateRange: { op: 'between', value: [new Date(), new Date()] }
  };
  
  render(<DashboardTable filters={filters} />);
  // Test filter application
});
```

### Validation Commands

```bash
# Before commit validation
pnpm typecheck
pnpm lint
pnpm vitest run tests/components --run
pnpm validate:cursor-rules
```

## Documentation Requirements

### Component Documentation
- Update `components/README.md` entries for ChatDock and ChatWindow to reflect props
- Keep a brief style guide in `docs/design/chat-style-guide.md`
- Document filter mapping patterns for tables
- Include accessibility guidelines

### API Documentation
- Document chat processing endpoint: `POST /api/v1/ai/chat`
- Include streaming NDJSON format specifications
- Document entity data helper functions
