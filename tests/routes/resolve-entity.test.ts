import { ALL_ENTITIES, isChatEntity, isGridEntity } from '@/lib/entities/registry';
import { describe, expect, it } from 'vitest';
import { z } from 'zod';

// Create schema locally for testing instead of importing unused export
const entityParamSchema = z.object({
  entity: z.enum(ALL_ENTITIES as any),
}).strict();

describe('entity param validation', () => {
  it('accepts known entities', () => {
    expect(entityParamSchema.parse({ entity: 'chat' }).entity).toBe('chat');
    expect(entityParamSchema.parse({ entity: 'projects' }).entity).toBe('projects');
  });

  it('rejects unknown entities', () => {
    expect(() => entityParamSchema.parse({ entity: 'unknown' })).toThrow();
  });
});

describe('entity kind predicates', () => {
  it('classifies chat', () => {
    expect(isChatEntity('chat')).toBe(true);
    expect(isGridEntity('chat')).toBe(false);
  });
  it('classifies grid', () => {
    expect(isGridEntity('projects')).toBe(true);
    expect(isChatEntity('projects')).toBe(false);
  });
});



