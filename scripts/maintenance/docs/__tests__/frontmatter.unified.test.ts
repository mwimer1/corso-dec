// scripts/maintenance/docs/__tests__/frontmatter.unified.test.ts
import { parseFrontmatter, stringifyFrontmatter, validateFrontmatter } from '@/scripts/utils/frontmatter';
import { describe, expect, it } from 'vitest';

describe('frontmatter unified API', () => {
  it('frontmatter unified API exists', () => {
    expect(parseFrontmatter).toBeDefined();
    expect(stringifyFrontmatter).toBeDefined();
    expect(validateFrontmatter).toBeDefined();
  });
});

