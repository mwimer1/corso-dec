/**
 * Unit tests for AI chat tools (SQL execution and table detection)
 */

import { describe, expect, it } from 'vitest';
import { createDetectedTableIntent } from '@/lib/api/ai/chat/tools';

describe('createDetectedTableIntent', () => {
  it('should return null for empty table array', () => {
    const result = createDetectedTableIntent([]);
    expect(result).toBeNull();
  });

  it('should return high confidence for single table', () => {
    const result = createDetectedTableIntent(['projects']);
    expect(result).toEqual({ table: 'projects', confidence: 1 });
  });

  it('should return high confidence for single company table', () => {
    const result = createDetectedTableIntent(['companies']);
    expect(result).toEqual({ table: 'companies', confidence: 1 });
  });

  it('should return high confidence for single addresses table', () => {
    const result = createDetectedTableIntent(['addresses']);
    expect(result).toEqual({ table: 'addresses', confidence: 1 });
  });

  it('should return lower confidence for multiple tables (first table)', () => {
    const result = createDetectedTableIntent(['projects', 'companies']);
    expect(result).toEqual({ table: 'projects', confidence: 0.5 });
  });

  it('should return lower confidence for multiple tables (three tables)', () => {
    const result = createDetectedTableIntent(['projects', 'companies', 'addresses']);
    expect(result).toEqual({ table: 'projects', confidence: 0.5 });
  });

  it('should handle multiple tables with same table repeated', () => {
    const result = createDetectedTableIntent(['projects', 'projects']);
    expect(result).toEqual({ table: 'projects', confidence: 0.5 });
  });
});
