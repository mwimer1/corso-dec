/**
 * Unit tests for AI chat prompt construction
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { buildSystemPrompt } from '@/lib/api/ai/chat/prompts';

// Mock getEnv and getSchemaSummary
vi.mock('@/lib/server/env', () => ({
  getEnv: vi.fn(() => ({
    AI_MAX_TOOL_CALLS: 3,
  })),
}));

vi.mock('@/lib/integrations/database/sql-guard', () => ({
  getSchemaSummary: vi.fn(() => '- projects\n- companies\n- addresses'),
}));

describe('buildSystemPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should build prompt without preferred table', () => {
    const prompt = buildSystemPrompt();
    
    expect(prompt).toContain('Corso AI');
    expect(prompt).toContain('Database Schema:');
    expect(prompt).toContain('projects');
    expect(prompt).toContain('companies');
    expect(prompt).toContain('addresses');
    expect(prompt).toContain('execute_sql');
    expect(prompt).toContain('describe_schema');
  });

  it('should build prompt with preferred table', () => {
    const prompt = buildSystemPrompt('projects');
    
    expect(prompt).toContain('Corso AI');
    expect(prompt).toContain('projects');
    expect(prompt).toContain('see describe_schema tool for columns');
    expect(prompt).not.toContain('companies');
    expect(prompt).not.toContain('addresses');
  });

  it('should include max tool calls limit', () => {
    const prompt = buildSystemPrompt();
    
    expect(prompt).toContain('up to 3 times');
  });

  it('should include tenant scoping rules', () => {
    const prompt = buildSystemPrompt();
    
    expect(prompt).toContain('Tenant scoping');
    expect(prompt).toContain('org_id');
    expect(prompt).toContain('automatically');
  });

  it('should include SQL safety rules', () => {
    const prompt = buildSystemPrompt();
    
    expect(prompt).toContain('SELECT');
    expect(prompt).toContain('INSERT');
    expect(prompt).toContain('UPDATE');
    expect(prompt).toContain('DELETE');
    expect(prompt).toContain('Never attempt mutations');
  });

  it('should include result limit information', () => {
    const prompt = buildSystemPrompt();
    
    expect(prompt).toContain('100 rows');
    expect(prompt).toContain('GROUP BY');
    expect(prompt).toContain('COUNT');
  });
});
