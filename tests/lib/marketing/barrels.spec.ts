import { describe, expect, it } from 'vitest';

describe('lib/marketing barrels', () => {
  it('client barrel does not leak server-only symbols', async () => {
    const client = await import('@/lib/marketing');
    expect(client).not.toHaveProperty('getAllInsights');
    expect(client).not.toHaveProperty('getInsightBySlug');
    expect(client).not.toHaveProperty('getInsightsByCategory');
  });

  it('server barrel exposes server-only symbols', async () => {
    const server = await import('@/lib/marketing/server');
    expect(server).toHaveProperty('getAllInsights');
  });
});

