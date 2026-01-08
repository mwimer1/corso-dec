// scripts/utils/__tests__/surfaces.test.ts
import { describe, expect, it } from 'vitest';
import * as barrels from '../barrel-utils';
import * as env from '../env/validation';
import * as fm from '../frontmatter/parsing';

describe('unified surfaces', () => {
  it('unified surfaces load', () => {
    expect(env).toBeTruthy();
    expect(fm).toBeTruthy();
    expect(barrels).toBeTruthy();
  });
});

