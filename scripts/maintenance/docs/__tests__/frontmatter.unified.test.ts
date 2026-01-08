// scripts/maintenance/docs/__tests__/frontmatter.unified.test.ts
import { readFrontmatter as parseFrontmatter } from '@/scripts/utils/frontmatter/parsing';
import { normalizeFrontmatter as validateFrontmatter } from '@/scripts/utils/frontmatter/validation';
import { stringifyMd as stringifyFrontmatter } from '@/scripts/utils/frontmatter/writing';
import { describe, expect, it } from 'vitest';

describe('frontmatter unified API', () => {
  it('frontmatter unified API exists', () => {
    expect(parseFrontmatter).toBeDefined();
    expect(stringifyFrontmatter).toBeDefined();
    expect(validateFrontmatter).toBeDefined();
  });
});

