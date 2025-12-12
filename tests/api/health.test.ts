import { describe, it, expect } from 'vitest';
import * as health from '@/app/api/health/route';

describe('health route', () => {
  it('declares edge runtime', () => {
    expect(health.runtime).toBe('edge');
  });

  it('GET returns ok payload', async () => {
    const res = await health.GET(new Request('http://localhost/api/health'));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(
      expect.objectContaining({
        success: true,
        data: expect.objectContaining({
          status: 'ok',
          timestamp: expect.any(String),
        }),
      }),
    );
  });

  it('HEAD returns 204', async () => {
    const res = await health.HEAD();
    expect(res.status).toBe(204);
  });
});

