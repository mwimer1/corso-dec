/**
 * Generic dashboard‑entity type helpers
 * (For warehouse‑specific entities see
 *  analytics/warehouse-entities.types.ts.)
 */

import type { Row } from '../../shared/core/entity/types';
import type { ISODateString } from '../../shared/dates/types';

/* ──────────────────────────────────────────────────────────────────── */
/* Chat message types                                                  */
/* ──────────────────────────────────────────────────────────────────── */

/**
 * Supported data-visualization types returned by the assistant.
 */
export type VisualizationType = 'table' | 'line' | 'bar' | 'pie';

/** A column definition returned alongside tabular data */
export interface ColumnDef {
  name: string;
  type: string;
}

/**
 * A single chat-message exchanged between the user and the assistant.
 *
 * Kept intentionally lightweight – richer analytics metadata lives in
 * dedicated telemetry tables.
 *
 * @example
 * // User message
 * const userMessage: ChatMessage = {
 *   id: 'msg_123',
 *   type: 'user',
 *   content: 'Show me all projects',
 *   timestamp: '2025-07-27T12:00:00Z'
 * };
 *
 * // Assistant message with visualization
 * const assistantMessage: ChatMessage = {
 *   id: 'msg_124',
 *   type: 'assistant',
 *   content: 'Here are your projects:',
 *   timestamp: '2025-07-27T12:00:01Z',
 *   tableData: [{ id: 1, name: 'Project A' }],
 *   tableColumns: [{ name: 'id', type: 'number' }, { name: 'name', type: 'string' }],
 *   visualizationType: 'table'
 * };
 */
export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: ISODateString;

  /* Optional structured data attached to an assistant message */
  tableData?: Row[];
  tableColumns?: ColumnDef[];
  visualizationType?: VisualizationType;

  metadata?: Record<string, unknown>;
  followUpQuestions?: string[];

  /* Flag for UI rendering of error states */
  isError?: boolean;
}



