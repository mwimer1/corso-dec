// lib/chat/client/types.ts
// Shared types for chat client streaming

import type { ColumnDef } from '@/types/chat';
import type { Row } from '@/types/shared';

/**
 * Assistant message structure in stream chunks.
 * Supports both text-only and structured table data.
 */
export interface AssistantMessageChunk {
  content: string;
  type: 'assistant';
  visualizationType?: 'table' | 'line' | 'bar' | 'pie';
  tableColumns?: ColumnDef[];
  tableData?: Row[];
}

export type AIChunk = {
  assistantMessage: AssistantMessageChunk | null;
  detectedTableIntent: { table: string; confidence: number } | null;
  error: string | null;
};
