'use client';

// Client wrapper that calls the streaming API for chat processing

import { publicEnv } from '@/lib/shared/config/client';

type AIChunk = {
  assistantMessage: any;
  detectedTableIntent: any;
  error: string | null;
};

export async function* processUserMessageStreamClient(
  content: string,
  preferredTable?: string | null,
  signal?: AbortSignal | null
): AsyncGenerator<AIChunk, void, unknown> {
  const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/v1/dashboard/chat/process`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content, preferredTable: preferredTable ?? undefined }),
    // TS lib.dom types sometimes expect AbortSignal | null; cast to satisfy
    signal: (signal ?? null) as unknown as AbortSignal,
  });

  if (!res.ok || !res.body) {
    const message = `Chat processing failed: ${res.status}`;
    const error = new Error(message);
    (error as any).status = res.status;
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



