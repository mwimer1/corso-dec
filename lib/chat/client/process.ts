'use client';

// Client wrapper that calls the streaming API for chat processing

import { publicEnv } from '@/lib/shared/config/client';
import { generateMockStream } from './mock-stream';
import type { AIChunk } from './types';

// Re-export types for backward compatibility
export type { AIChunk, AssistantMessageChunk } from './types';

export async function* processUserMessageStreamClient(
  content: string,
  preferredTable?: string | null,
  signal?: AbortSignal | null,
  history?: Array<{ role: 'user' | 'assistant'; content: string }>,
  orgId?: string | null,
  modelTier?: 'auto' | 'fast' | 'thinking' | 'pro',
  deepResearch?: boolean
): AsyncGenerator<AIChunk, void, unknown> {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/v1/ai/chat`;

  // Mock mode: if enabled via env, use extracted mock stream generator
  const mockAiEnv = publicEnv.NEXT_PUBLIC_USE_MOCK_AI;
  const useMock = mockAiEnv === 'true' || mockAiEnv === '1';
  if (useMock) {
    // Use extracted mock stream generator (matches production NDJSON format)
    yield* generateMockStream(content, preferredTable);
    return; // end the generator
  }
  
  // Build headers with org ID if provided
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (orgId) {
    headers['X-Corso-Org-Id'] = orgId;
  }
  
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ 
      content, 
      preferredTable: preferredTable ?? undefined,
      history: history ?? undefined,
      modelTier: modelTier ?? 'auto',
      deepResearch: deepResearch ?? false,
    }),
    // TS lib.dom types sometimes expect AbortSignal | null; cast to satisfy
    signal: (signal ?? null) as unknown as AbortSignal,
  });

  if (!res.ok || !res.body) {
    // Try to parse error response body for detailed error message and code
    let errorMessage = `Chat processing failed: ${res.status}`;
    let errorCode: string | undefined;
    try {
      const errorBody = await res.json();
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      }
      if (errorBody?.error?.code) {
        errorCode = errorBody.error.code;
      }
    } catch {
      // If parsing fails, use default message
    }
    const error = new Error(errorMessage) as Error & { status?: number; code?: string };
    error.status = res.status;
    if (errorCode) {
      error.code = errorCode;
    }
    throw error;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let lines = buffer.split('\n');
    buffer = lines.pop()!;
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      try {
        yield JSON.parse(trimmed) as AIChunk;
      } catch {
        // ignore malformed chunks
      }
    }
  }

  if (buffer.trim()) {
    try {
      yield JSON.parse(buffer) as AIChunk;
    } catch {
      // ignore trailing malformed chunk
    }
  }
}



