import { describe, expect, it } from 'vitest';

// Import the route module to read its exports
import * as PageModule from '@/app/(protected)/dashboard/(entities)/[entity]/page';

describe('chat route runtime boundary', () => {
  it('exports Node runtime and disables caching', () => {
    expect(PageModule.runtime).toBe('nodejs');
    expect(PageModule.dynamic).toBe('force-dynamic');
    expect(PageModule.revalidate).toBe(0);
  });
});

