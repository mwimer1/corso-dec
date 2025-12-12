import * as route from '@/app/api/v1/entity/[entity]/export/route';
import { NextRequest } from 'next/server';
import { describe, expect, it } from 'vitest';

function makeReq(url: string, method = 'OPTIONS') {
  return new NextRequest(new URL(url, 'http://localhost').toString(), {
    method,
    headers: {
      'Origin': 'https://example.com'
    }
  });
}

describe('export route CORS', () => {
  it('OPTIONS returns 204 and CORS headers', async () => {
    const res = await route.OPTIONS(makeReq('/api/v1/entity/projects/export'));
    expect(res.status).toBe(204);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeTruthy();
  });
});

