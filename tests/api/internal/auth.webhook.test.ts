import { POST } from '@/app/api/internal/auth/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock svix Webhook verification
let verifyShouldThrow = false;
let verifyShouldReturnInvalid = false;

vi.mock('svix', () => {
  return {
    Webhook: class {
      constructor(_secret: string) {}
      verify(raw: string, _headers: Record<string, string>) {
        if (verifyShouldThrow) {
          throw new Error('Signature verification failed');
        }
        // Parse the raw JSON and return a properly formatted Clerk event object
        const parsed = JSON.parse(raw);
        const result = {
          id: parsed.id,
          type: parsed.type,
          object: verifyShouldReturnInvalid ? 'invalid' : 'event',
          data: parsed.data,
        };
        verifyShouldReturnInvalid = false; // Reset after use
        return result;
      }
    }
  };
});

describe('POST /api/internal/auth (Clerk webhook)', () => {
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test';
    verifyShouldThrow = false;
    verifyShouldReturnInvalid = false;
    vi.clearAllMocks();
  });

  it('returns 204 for valid signature and payload with Svix headers', async () => {
    const body = JSON.stringify({
      id: 'evt_1',
      type: 'user.created',
      data: { id: 'user_1', email_addresses: [{ email_address: 'a@b.com' }] },
    });
    const req = new Request('http://localhost/api/internal/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': 'msg_1',
        'svix-timestamp': String(Math.floor(Date.now() / 1000)),
        'svix-signature': 'v1,stub',
      },
      body,
    });

    const res = await (POST as unknown as (r: Request) => Promise<Response>)(req);
    expect(res.status).toBe(204);
  });

  it('returns 204 for valid signature and payload with Clerk signature header', async () => {
    const body = JSON.stringify({
      id: 'evt_2',
      type: 'user.updated',
      data: { id: 'user_2' },
    });
    const req = new Request('http://localhost/api/internal/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'clerk-signature': 'v1,stub',
      },
      body,
    });

    const res = await (POST as unknown as (r: Request) => Promise<Response>)(req);
    expect(res.status).toBe(204);
  });

  it('returns 400 for invalid signature', async () => {
    verifyShouldThrow = true;

    const body = JSON.stringify({ id: 'evt_3', type: 'user.created', data: { id: 'user_3' } });
    const req = new Request('http://localhost/api/internal/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'clerk-signature': 'bad_signature',
      },
      body,
    });

    const res = await (POST as unknown as (r: Request) => Promise<Response>)(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_WEBHOOK_SIGNATURE');
  });

  it('returns 400 for invalid payload validation', async () => {
    verifyShouldReturnInvalid = true;

    const body = JSON.stringify({
      id: 'evt_4',
      type: 'user.created',
      // Missing required 'object' field or invalid value
    });
    const req = new Request('http://localhost/api/internal/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': 'msg_4',
        'svix-timestamp': String(Math.floor(Date.now() / 1000)),
        'svix-signature': 'v1,stub',
      },
      body,
    });

    const res = await (POST as unknown as (r: Request) => Promise<Response>)(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('INVALID_WEBHOOK_PAYLOAD');
  });

  it('handles raw body parsing correctly', async () => {
    // Test that raw body is read correctly (not parsed as JSON first)
    const rawBody = JSON.stringify({
      id: 'evt_5',
      type: 'user.deleted',
      data: { id: 'user_5' },
    });
    const req = new Request('http://localhost/api/internal/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': 'msg_5',
        'svix-timestamp': String(Math.floor(Date.now() / 1000)),
        'svix-signature': 'v1,stub',
      },
      body: rawBody,
    });

    const res = await (POST as unknown as (r: Request) => Promise<Response>)(req);
    expect(res.status).toBe(204);
  });

  it('returns 500 when webhook secret is not configured', async () => {
    // Mock getEnv to return empty secret
    const { getEnv } = await import('@/lib/server/env');
    const originalGetEnv = getEnv;
    vi.spyOn(await import('@/lib/server/env'), 'getEnv').mockReturnValue({
      ...originalGetEnv(),
      CLERK_WEBHOOK_SECRET: '',
    } as any);

    const body = JSON.stringify({
      id: 'evt_6',
      type: 'user.created',
      data: { id: 'user_6' },
    });
    const req = new Request('http://localhost/api/internal/auth', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'svix-id': 'msg_6',
        'svix-timestamp': String(Math.floor(Date.now() / 1000)),
        'svix-signature': 'v1,stub',
      },
      body,
    });

    const res = await (POST as unknown as (r: Request) => Promise<Response>)(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('WEBHOOK_CONFIG_ERROR');

    vi.restoreAllMocks();
  });
});



