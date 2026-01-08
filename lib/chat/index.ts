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

