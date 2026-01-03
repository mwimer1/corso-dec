'use client';

// Client wrapper that calls the streaming API for chat processing

import { publicEnv } from '@/lib/shared/config/client';

export type AIChunk = {
  assistantMessage: { content: string; type: 'assistant' } | null;
  detectedTableIntent: { table: string; confidence: number } | null;
  error: string | null;
};

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

  // Mock mode: if enabled via env, yield a fake response instead of calling API
  // Type assertion needed temporarily until TypeScript picks up the schema change
  const mockAiEnv = (publicEnv as typeof publicEnv & { NEXT_PUBLIC_USE_MOCK_AI?: string }).NEXT_PUBLIC_USE_MOCK_AI;
  const useMock = mockAiEnv === 'true' || mockAiEnv === '1';
  if (useMock) {
    // Simulate a short typing delay (e.g., 500ms)
    await new Promise(res => setTimeout(res, 500));
    // Determine mode and question for tailoring the response
    let mode = preferredTable || 'projects';
    const modeMatch = content.match(/^\[mode:(projects|companies|addresses)\]\s*/i);
    if (modeMatch) {
      mode = modeMatch[1] as typeof mode;
    }
    // Remove mode prefix from content for analysis
    const question = content.replace(/^\[mode:\w+\]\s*/i, '').toLowerCase();
    let answer = '';
    if (mode === 'projects') {
      if (/last\s*30\s*days/.test(question)) {
        answer = "In the last 30 days, there have been **42 permits** issued, totaling approximately **$3.5 million** in project value. The activity has been steady, with a slight uptick toward the end of the month.";
      } else if (/top\s*10\s*contractors/.test(question)) {
        answer = "Here are the **Top 10 Contractors by total job value YTD**:\n1. Alpha Construction – $5.4M\n2. BuildIt Corp – $4.8M\n3. Skyline LLC – $4.5M\n4. Ace Builders – $4.0M\n5. Red House Co – $3.9M\n6. ProLine Inc – $3.5M\n7. Urban Contractors – $3.1M\n8. Prime Renovation – $2.8M\n9. North Star Constr. – $2.5M\n10. Future Homes – $2.3M\n(These figures are mock data.)";
      } else if (/trending/.test(question) || /trends?/.test(question)) {
        answer = "**Trending Project Types:** Residential remodels are on the rise this quarter, up 15%. Solar panel installations have also increased. Commercial developments remain steady. It looks like sustainable projects are a key trend recently.";
      } else {
        answer = "Project analysis complete. (This is a mock response.) Based on the data, everything looks normal. Feel free to ask about permits, contractors, or trends!";
      }
    } else if (mode === 'companies') {
      if (/top/.test(question) || /largest/.test(question)) {
        answer = "The top companies by project count include **Alpha Construction**, **Beta Builders**, and **Gamma Contractors**. Alpha Construction has the most projects so far this year. (Mock data)";
      } else {
        answer = "There are **256 companies** in our system. Companies are performing within normal ranges. (This is a mock summary for company data.)";
      }
    } else if (mode === 'addresses') {
      if (/history|records|permits/.test(question)) {
        answer = "This address has had **5 permits** in the last 10 years, including new construction and renovations. The latest activity was a permit issued 2 months ago. (Mock data)";
      } else {
        answer = "I've looked up that address. All records are in good order, with no recent violations or unusual activity. (Response generated in mock mode.)";
      }
    }
    if (!answer) {
      answer = "I'm sorry, I don't have information on that. (This is a mock response.)";
    }
    // Yield a single chunk with the assembled answer
    yield {
      assistantMessage: { content: answer, type: 'assistant' },
      detectedTableIntent: null,
      error: null
    };
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
    const message = `Chat processing failed: ${res.status}`;
    const error = new Error(message) as Error & { status?: number };
    error.status = res.status;
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



