// Re-export TableIntent from query domain where it's canonically defined
export type { TableIntent } from '../query/types';

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

export interface ChatStreamChunk {
  sql?: string;
  explanation?: string;
  isValid?: boolean;
  chartType?: string;
  /**
   * Catch-all for additional fields returned by the model stream.
   * Use with caution – prefer explicit fields above.
   */
  [key: string]: unknown;
}

