import { describe, expect, it } from 'vitest';

describe('User Route', () => {
  describe('POST /api/v1/user', () => {
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

