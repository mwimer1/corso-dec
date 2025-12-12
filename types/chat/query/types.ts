// types/chat/query/types.ts

export interface QueryFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'nin' | 'like' | 'ilike';
  value: string | number | boolean | (string | number | boolean)[];
}

export interface QueryIntent {
  type: 'data_query' | 'chat' | 'help' | 'visualization' | 'analysis';
  originalQuery: string;
  entities: {
    tables: string[];
    columns?: string[];
    filters?: QueryFilter[];
  };
  suggestedSQL?: string;
  confidence?: number;
}

export interface ChatQueryResult {
  data: Record<string, unknown>[];
  columns: {
    name: string;
    type: string;
  }[];
  executionTime: number;
  totalRows: number;
  sql: string;
  error?: string;
}

export interface NLtoSQLResult {
  sql: string;
  explanation: string;
  isValid: boolean;
  error?: string;
  confidence?: number;
}

export interface QueryIntentDetection {
  intent: 'data_query' | 'visualization' | 'analysis' | 'general' | 'help';
  confidence: number;
  entities: {
    entity_type: string;
    entity_value: string;
    confidence: number;
  }[];
  suggested_actions?: string[];
}

export interface TableIntent {
  type: 'projects' | 'subscriptions' | 'general';
  confidence: number;
  originalQuery: string;
}

export interface BuildSqlPrompt {
  question: string;
  allowedTables: string[];
  detectedTableIntent?: TableIntent | null;
}

