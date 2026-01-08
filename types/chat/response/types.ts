// Re-export TableIntent from query domain where it's canonically defined
export type { TableIntent } from '../query/types';

import type { ColumnDef } from '../message/types';
import type { Row } from '../../shared/core/entity/types';

export interface ChartConfig {
  title: string;
  chartType: 'table' | 'line' | 'bar' | 'pie';
  explanation?: string;
  subtitle?: string;
  xAxis?: string;
  yAxis?: string | string[];
  categoryField?: string;
  valueField?: string;
}

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

export interface ChatStreamChunk {
  sql?: string;
  explanation?: string;
  isValid?: boolean;
  chartType?: string;
  assistantMessage?: AssistantMessageChunk | null;
  /**
   * Catch-all for additional fields returned by the model stream.
   * Use with caution – prefer explicit fields above.
   */
  [key: string]: unknown;
}

