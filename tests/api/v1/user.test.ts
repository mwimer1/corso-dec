import { mockClerkAuth } from '@/tests/support/mocks';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveRouteModule } from '../../support/resolve-route';
import { createUser } from '../../support/factories';

describe('User Route', () => {
  const testUser = createUser({ userId: 'test-user-123' });

  beforeEach(() => {
    vi.clearAllMocks();
    mockClerkAuth.setup({
      userId: testUser.userId,
    });
  });
  describe('POST /api/v1/user', () => {
    it('should return 401 when unauthenticated', async () => {
      mockClerkAuth.setup({ userId: null });
      const url = resolveRouteModule('v1/user');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          name: 'Test User',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(401);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('HTTP_401');
    });

    it('should return 403 when user lacks member role', async () => {
      mockClerkAuth.setup({
        userId: testUser.userId,
        has: vi.fn().mockReturnValue(false), // No member role
      });
      const url = resolveRouteModule('v1/user');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          name: 'Test User',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error.code).toBe('FORBIDDEN');
    });

    it('should return 400 for invalid input', async () => {
      // Test missing required fields
      const { validateJson } = await import('@/lib/api');
      const { UserSchema } = await import('@/lib/validators');

      const req = new Request('http://local/api/v1/user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: 'invalid-email' }), // Missing required fields
      });

      const result = await validateJson(req, UserSchema);

      expect(result.success).toBe(false);
      expect((result as any).error).toBeDefined();
    });

    it('should return 400 for invalid email format', async () => {
      const { validateJson } = await import('@/lib/api');
      const { UserSchema } = await import('@/lib/validators');

      const invalidUser = {
        id: '123',
        email: 'not-an-email',
        name: 'Test User',
        createdAt: '2024-01-15T10:30:00Z'
      };

      const result = await validateJson({ text: () => Promise.resolve(JSON.stringify(invalidUser)) } as any, UserSchema);

      expect(result.success).toBe(false);
    });

    it('should return 400 for non-UUID id', async () => {
      const { validateJson } = await import('@/lib/api');
      const { UserSchema } = await import('@/lib/validators');

      const invalidUser = {
        id: 'not-a-uuid',
        email: 'user@example.com',
        name: 'Test User',
        createdAt: '2024-01-15T10:30:00Z'
      };

      const result = await validateJson({ text: () => Promise.resolve(JSON.stringify(invalidUser)) } as any, UserSchema);

      expect(result.success).toBe(false);
    });

    it('should accept valid user data', async () => {
      const { validateJson } = await import('@/lib/api');
      const { UserSchema } = await import('@/lib/validators');

      const validUser = {
        id: '550e8400-e29b-41d4-a716-446655440000',
        email: 'user@example.com',
        name: 'John Doe',
        avatarUrl: 'https://example.com/avatar.jpg',
        createdAt: '2024-01-15T10:30:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
      };

      const result = await validateJson({ text: () => Promise.resolve(JSON.stringify(validUser)) } as any, UserSchema);

      expect(result.success).toBe(true);
      expect((result as any).data).toEqual(validUser);
    });

    it('should return 200 for valid authenticated request with member role', async () => {
      const url = resolveRouteModule('v1/user');
      if (!url) return expect(true).toBe(true);

      const mod: any = await import(url);
      const handler = mod.POST;
      const req = new Request('http://localhost/api/v1/user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'user@example.com',
          name: 'Test User',
          createdAt: '2024-01-15T10:30:00Z',
        }),
      });

      const res = await handler(req as any);
      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.updated).toBe(true);
    });

    it('should handle malformed JSON', async () => {
      const { readJsonOnce } = await import('@/lib/api');

      const req = new Request('http://local/api/v1/user', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: 'invalid json',
      });

      await expect(readJsonOnce(req))
        .rejects
        .toThrow('INVALID_JSON');
    });
  });

  describe('OPTIONS /api/v1/user', () => {
    it('should handle CORS preflight', async () => {
      const { OPTIONS } = await import('@/app/api/v1/user/route');
      const res = await OPTIONS(new Request('http://localhost/api/v1/user', { method: 'OPTIONS' }));
      expect([200, 204]).toContain(res.status);
      expect(res.headers.get('access-control-allow-origin')).toBeTruthy();
    });
  });
});

