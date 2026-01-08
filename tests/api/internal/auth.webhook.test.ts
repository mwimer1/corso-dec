import { POST } from '@/app/api/internal/auth/route';
import { beforeEach, describe, expect, it, vi } from 'vitest';

// Mock svix Webhook verification
vi.mock('svix', () => {
  return {
    Webhook: class {
      constructor(_secret: string) {}
      verify(raw: string, _headers: Record<string, string>) {
        // Parse the raw JSON and return a properly formatted Clerk event object
        const parsed = JSON.parse(raw);
        return {
          id: parsed.id,
          type: parsed.type,
          object: 'event',
          data: parsed.data,
        };
      }
    }
  };
});

describe('POST /api/internal/auth (Clerk webhook)', () => {
  beforeEach(() => {
    process.env.CLERK_WEBHOOK_SECRET = 'whsec_test';
  });

  it('returns 204 for valid signature and payload', async () => {
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

  it('returns 400 for invalid signature', async () => {
    // Override verify to throw
    const { Webhook } = await import('svix');
    // @ts-expect-error override for test
    Webhook.prototype.verify = () => { throw new Error('bad sig'); };

    const body = JSON.stringify({ id: 'evt_2', type: 'user.created', data: { id: 'user_2' } });
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
});



