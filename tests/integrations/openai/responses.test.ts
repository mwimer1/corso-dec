// tests/integrations/openai/responses.test.ts
// Sprint 3: Unit tests for Responses API streaming adapter

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { streamResponseEvents, executeSqlTool } from '@/lib/integrations/openai/responses';
import type OpenAI from 'openai';

// Mock dependencies
vi.mock('@/lib/integrations/openai/server');
vi.mock('@/lib/server/env');

describe('Responses API Streaming Adapter', () => {
  const mockExecuteSql = vi.fn();
  const mockOnChunk = vi.fn();
  const mockClient = {
    responses: {
      create: vi.fn(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockExecuteSql.mockResolvedValue('Query result: 42');
    
    // Mock createOpenAIClient
    const { createOpenAIClient } = await import('@/lib/integrations/openai/server');
    vi.mocked(createOpenAIClient).mockReturnValue(mockClient as any);
    
    // Mock getEnv
    const { getEnv } = await import('@/lib/server/env');
    vi.mocked(getEnv).mockReturnValue({
      AI_MAX_TOOL_CALLS: 3,
    } as any);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('executeSqlTool', () => {
    it('defines execute_sql tool with correct schema', () => {
      expect(executeSqlTool.type).toBe('function');
      expect(executeSqlTool.name).toBe('execute_sql');
      expect(executeSqlTool.strict).toBe(true);
      expect(executeSqlTool.parameters).toMatchObject({
        type: 'object',
        properties: {
          query: {
            type: 'string',
          },
        },
        required: ['query'],
        additionalProperties: false,
      });
    });
  });

  describe('streamResponseEvents', () => {
    it('emits text chunks for simple text response', async () => {
      // Mock Responses API stream with text deltas
      const mockStream = (async function* () {
        yield {
          type: 'response.output_text.delta',
          delta: 'Hello',
          item_id: 'item-1',
          output_index: 0,
          content_index: 0,
          sequence_number: 1,
        } as OpenAI.Responses.ResponseTextDeltaEvent;
        yield {
          type: 'response.output_text.delta',
          delta: ' there',
          item_id: 'item-1',
          output_index: 0,
          content_index: 0,
          sequence_number: 2,
        } as OpenAI.Responses.ResponseTextDeltaEvent;
        yield {
          type: 'response.completed',
          sequence_number: 3,
        } as OpenAI.Responses.ResponseCompletedEvent;
      })();

      mockClient.responses.create.mockResolvedValue(mockStream);

      await streamResponseEvents(
        {
          model: 'gpt-4o-mini',
          instructions: 'You are a helpful assistant.',
          input: [{ role: 'user', content: 'Hello' }],
          maxToolCalls: 3,
        },
        mockExecuteSql,
        'test-org',
        mockOnChunk,
      );

      // Should emit chunks with accumulated text
      expect(mockOnChunk).toHaveBeenCalled();
      const calls = mockOnChunk.mock.calls;
      expect(calls.length).toBeGreaterThan(0);
      
      // First call should have "Hello"
      expect(calls[0]?.[0]?.assistantMessage?.content).toContain('Hello');
      
      // Later call should have "Hello there"
      const lastCall = calls[calls.length - 1];
      expect(lastCall?.[0]?.assistantMessage?.content).toContain('Hello there');
    });

    // Note: Additional tests for multi-tool loops, tool call limits, and error handling
    // would require more complex mocking of the Responses API event stream.
    // These can be added as integration tests or with more sophisticated mocks.
  });
});


