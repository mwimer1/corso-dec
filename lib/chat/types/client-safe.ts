// Client-safe types for chat functionality
// These types can be safely imported by client components

import type { ApplicationError } from '@/lib/shared';

/**
 * SQL stream chunk returned by OpenAI SQL generation
 */
export interface SQLStreamChunk {
  content?: string;
  error?: ApplicationError;
}

