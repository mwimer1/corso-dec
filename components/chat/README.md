---
title: "Chat"
last_updated: "2026-01-07"
category: "documentation"
status: "draft"
---
# Chat Components

Components and utilities for the Corso chat interface.

## Directory Structure

- **`sections/`** - Main chat sections (chat-window, chat-composer, chat-page)
- **`components/`** - Chat-specific UI components (model dropdown, preset dropdown, scope buttons)
- **`widgets/`** - Reusable chat widgets (chat-table, chat-welcome, follow-up-chips, message-item)
- **`hooks/`** - Chat-specific React hooks (use-chat)
- **`lib/`** - Chat utilities and types (chat-mode, chat-presets)
- **`utils/`** - Helper utilities (time-utils)

## Chat Tools Menu

The chat composer includes a tools menu (triggered by the "+" button) that provides access to chat features:

### Menu Structure

- **Chat Tools Section**
  - Deep Research (Coming Soon) - Comprehensive analysis mode (currently disabled)
- **Saved Prompts Section**
  - Saved Prompts (Coming Soon) - User-saved prompt templates (currently disabled)

Both menu items are currently disabled with "Coming Soon" badges, allowing for future feature expansion without blocking production launch.

## Preset Visibility Behavior

Preset prompts (suggested questions) use a **transient, focus-based system** in new chat mode:

### Default Behavior
- **On input focus**: When the chat input is focused in a fresh/new chat (no history), default recommended presets are automatically shown
- **Scope buttons**: Three buttons (Projects, Companies, Addresses) trigger scope-specific presets temporarily
- **Transient state**: Buttons do **not** persist selected state - they trigger dropdowns temporarily

### Visual Design
The preset dropdown is designed to appear as a seamless extension of the chat input container:
- **Seamless connection**: The dropdown connects directly to the input container with no gap, appearing as a unified component
- **Conditional border-radius**: The input container uses `rounded-t-2xl` (top corners only) when the dropdown is visible, and `rounded-2xl` (all corners) when hidden
- **Unified styling**: The dropdown uses matching border width (`border-2`) and background color to create a continuous visual element

### Preset Display Rules
Presets are shown when:
- The chat input is focused in new chat mode (shows default presets)
- A scope button (Projects, Companies, Addresses) is clicked (shows scope-specific presets)
- The chat has no message history (`hasHistory === false`)
- Presets are available for the current scope
- The input field is empty

Presets are automatically hidden when:
- The user starts typing in the input field
- A preset option is selected
- The user clicks outside the chat input/dropdown area (resets scope and hides presets)
- The chat transitions to active mode (has message history)

### Scope Management
- **Default scope**: `'default'` (replaces previous `'recommended'`) - shows general recommended presets
- **Transient scopes**: `'projects'`, `'companies'`, `'addresses'` - shown temporarily when buttons are clicked
- **Reset behavior**: Clicking outside the composer resets scope to `null` (no active button) and hides presets
- **Focus behavior**: Clicking back into the input shows default presets again

## API Integration

### Streaming Behavior

The chat interface uses NDJSON (newline-delimited JSON) streaming for real-time AI responses:

**Stream Format:**
Each line in the stream is a JSON object with the following structure:
```json
{
  "assistantMessage": {
    "content": "Response text...",
    "type": "assistant"
  },
  "detectedTableIntent": { "table": "projects", "confidence": 1.0 } | null,
  "error": null
}
```

**Stream Parsing:**
- Lines are split by `\n`
- Each line is parsed as JSON
- Partial lines are buffered until complete
- Multiple JSON objects per chunk are supported
- Trailing newlines are handled gracefully

### Usage Limits Endpoint

Deep Research usage limits are fetched from `/api/v1/ai/chat/usage-limits`:

**Endpoint:** `GET /api/v1/ai/chat/usage-limits`
- **Auth:** Bearer token required (RBAC: member or higher)
- **Response:** `{ success: true, data: { remaining: number, limit: number, currentUsage: number } }`
- **Rate Limit:** 30 requests per minute

**Usage:**
The `useUsageLimits` hook automatically fetches limits when Deep Research is enabled:
```tsx
const limits = useUsageLimits(deepResearch);
// Returns { remaining, limit, currentUsage } or null if unavailable
```

### Tool Call Limits

SQL tool calls (`execute_sql`) are subject to:
- **Row limit:** 100 rows maximum per query (enforced by SQL guard)
- **Concurrency limit:** Configurable via `CLICKHOUSE_CONCURRENCY_LIMIT` env var (default: 8)
- **Timeout:** Configurable via `AI_QUERY_TIMEOUT_MS` env var (default: 5000ms)

### Rate Limits

**Chat Endpoint:** `/api/v1/ai/chat`
- **Limit:** 30 requests per minute per user
- **Key Strategy:** Per-user limits (uses `x-clerk-user-id` header)
- **Fallback:** IP-based for anonymous users

**Usage Limits Endpoint:** `/api/v1/ai/chat/usage-limits`
- **Limit:** 30 requests per minute per user

## Design Tokens

Chat-specific design tokens are defined directly in `components/chat/chat.module.css`:

- **Container widths**: `--chat-container-max-w-sm`, `--chat-container-max-w-md`, `--chat-container-max-w-lg`
- **Spacing**: `--chat-message-gap`, `--chat-composer-padding-x/y`
- **Border radius**: `--chat-composer-radius`

**Note**: These tokens are component-specific and are defined at the top of the CSS module file for easy maintenance and consistency with the rest of the codebase.

## Styling

The chat interface uses a CSS module (`chat.module.css`) for component-specific styles and tokens:

```tsx
import styles from './chat.module.css';

// Use bracket notation for TypeScript compatibility
<div className={styles['chatWindow']}>
  <div className={styles['messagesContainer']}>
    <div className={styles['messagesList']}>
      {/* Messages */}
    </div>
  </div>
</div>
```

### Token Usage in Chat Styles

```css
/* components/chat/chat.module.css */
/* Component-specific design tokens */
:root {
  --chat-message-gap: 1rem;
  --chat-composer-padding-x: 1.5rem;
  --chat-composer-padding-y: 1.25rem;
  --chat-container-max-w-sm: 48rem;
  --chat-container-max-w-md: 56rem;
  --chat-container-max-w-lg: 64rem;
  --chat-composer-radius: 1rem;
}

.messagesList {
  max-width: var(--chat-container-max-w-sm);
  padding: var(--space-md) var(--space-lg);
}

@media (min-width: 1024px) {
  .messagesList {
    max-width: var(--chat-container-max-w-md);
  }
}
```

The CSS module uses design tokens for:
- Container widths (responsive breakpoints)
- Spacing (padding, gaps)
- Colors (via semantic tokens like `--background`, `--foreground`, `--border`)
- Border radius (via chat-specific tokens)
- Safe-area padding: Bottom padding uses `env(safe-area-inset-bottom)` for iOS notch/home indicator support

### Mobile UX Considerations

- **Safe-area padding**: Composer container uses `calc(padding + env(safe-area-inset-bottom))` to prevent content from being hidden behind iOS home indicator
- **Keyboard handling**: Composer remains accessible when virtual keyboard is shown (via CSS positioning and safe-area insets)
- **Responsive containers**: Message list and composer use responsive max-widths (`--chat-container-max-w-sm/md/lg`) for optimal readability

## Chat Data Answers (Tool Calling)

The chat interface supports data-backed answers through OpenAI function calling. When a user asks a question requiring database information, the assistant can execute SQL queries safely and return data-grounded responses.

### Tool Functions

The chat endpoint provides two tool functions:

- **`execute_sql`**: Executes a SQL SELECT query to retrieve data from the database
  - Only SELECT queries are allowed
  - Results are limited to 100 rows (enforced by SQL Guard)
  - Tenant scoping is automatically enforced (orgId from auth session)
  - SQL validation uses SQL Guard for AST-based security checks
- **`describe_schema`**: Returns the database schema (available tables and columns) to help the model understand the data structure

### Safety Limits & Security

- **Row limit**: Maximum 100 rows per query (enforced by SQL Guard)
- **Query timeout**: 5 seconds per query (`AI_QUERY_TIMEOUT_MS`)
- **Tool call limit**: Maximum 3 tool calls per conversation turn (`AI_MAX_TOOL_CALLS`)
- **Tenant isolation**: All queries are automatically scoped to the user's organization (orgId from auth session, not user input)
- **SQL validation**: SQL Guard performs AST-based validation:
  - Blocks dangerous operations (DROP, ALTER, INSERT, UPDATE, DELETE)
  - Blocks multi-statement queries
  - Blocks UNION injection patterns
  - Blocks SQL comments
  - Enforces SELECT-only queries
- **Input sanitization**: User input is sanitized to prevent prompt injection attacks

### Multi-Step Tool Calling

The assistant can make up to 3 tool calls per conversation turn for multi-step analysis:
1. First tool call: Query schema or initial data
2. Second tool call: Refine query based on results
3. Third tool call: Final query or analysis
4. Final response: Assistant summarizes findings from all tool calls

When the tool call limit is reached, the assistant message includes a note explaining the limit was reached.

### Streaming Behavior

Tool calls are handled within the streaming NDJSON response:
- Tool call requests are detected in the stream
- SQL is executed server-side
- Results are formatted and returned to the model
- Model continues streaming the final response
- All interactions maintain the same NDJSON streaming format

### Error Handling

- **SQL Guard errors**: Return safe, user-friendly messages (no SQL internals leaked)
- **Database errors**: Sanitized in streamed NDJSON (generic messages to users, detailed errors in logs)
- **Tool loop termination**: Reasons logged: `max_tool_calls`, `timeout`, `openai_error`, `validation_error`, `completed`, `aborted`
- **Retry behavior**: Users can retry failed queries via the retry button in the chat UI

### Example Usage

User: "How many projects were created in 2024?"

Assistant flow:
1. Model recognizes need for data query
2. Model calls `execute_sql` with: `SELECT COUNT(*) FROM projects WHERE year = 2024`
3. SQL Guard validates and executes query (with tenant scoping)
4. Results returned to model
5. Model streams response: "In 2024, there were **142 projects** created in your organization."

### Implementation Details

- **Tool definitions**: `lib/api/ai/chat/tools.ts` contains `executeSqlAndFormat` and `describeSchema` functions
- **Streaming integration**: `lib/api/ai/chat/streaming.ts` handles tool calls within streaming responses
- **SQL execution**: Uses ClickHouse client (`lib/integrations/clickhouse/server.ts`) with SQL Guard validation
- **Security**: SQL Guard (`lib/integrations/database/sql-guard.ts`) performs AST-based validation and tenant scoping
- **Logging**: Structured logging for tool calls with PII redaction (see `lib/integrations/openai/chat-logging.ts`)

See `app/api/v1/README.md` for detailed API documentation on tool calling limits and behavior.