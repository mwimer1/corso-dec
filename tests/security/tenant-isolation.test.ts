// tests/integration/tenant-isolation.test.ts
// Integration tests for tenant isolation via RLS context
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTenantContext } from '@/lib/server/db/tenant-context';
import { getTenantScopedSupabaseClient } from '@/lib/server/db/supabase-tenant-client';
import { auth } from '@clerk/nextjs/server';
import type { NextRequest } from 'next/server';

// Mock Clerk auth
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(),
}));

// Mock Supabase admin client
vi.mock('@/lib/integrations/supabase/server', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}));

describe('Tenant Isolation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTenantContext', () => {
    it('should extract orgId from X-Corso-Org-Id header', async () => {
      const mockAuth = auth as ReturnType<typeof vi.fn>;
      mockAuth.mockResolvedValue({ userId: 'user-123' });

      const req = {
        headers: new Headers({
          'x-corso-org-id': 'org-456',
        }),
      } as unknown as NextRequest;

      const context = await getTenantContext(req);

      expect(context.orgId).toBe('org-456');
      expect(context.userId).toBe('user-123');
    });

    it('should throw if orgId is missing', async () => {
      const mockAuth = auth as ReturnType<typeof vi.fn>;
      mockAuth.mockResolvedValue({ userId: 'user-123' });

      const req = {
        headers: new Headers({}),
      } as unknown as NextRequest;

      await expect(getTenantContext(req)).rejects.toThrow('Organization ID required');
    });

    it('should throw if user is not authenticated', async () => {
      const mockAuth = auth as ReturnType<typeof vi.fn>;
      mockAuth.mockResolvedValue({ userId: null });

      const req = {
        headers: new Headers({
          'x-corso-org-id': 'org-456',
        }),
      } as unknown as NextRequest;

      await expect(getTenantContext(req)).rejects.toThrow('User not authenticated');
    });
  });

  describe('getTenantScopedSupabaseClient', () => {
    it('should set RLS context before returning client', async () => {
      const mockAuth = auth as ReturnType<typeof vi.fn>;
      mockAuth.mockResolvedValue({ userId: 'user-123' });

      const mockRpc = vi.fn().mockResolvedValue({ error: null });
      const { getSupabaseAdmin } = await import('@/lib/integrations/supabase/server');
      const mockClient = {
        rpc: mockRpc,
        from: vi.fn(),
      };
      (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const req = {
        headers: new Headers({
          'x-corso-org-id': 'org-456',
        }),
      } as unknown as NextRequest;

      const client = await getTenantScopedSupabaseClient(req);

      expect(mockRpc).toHaveBeenCalledWith('set_rls_context', {
        org_id: 'org-456',
        user_id: 'user-123',
      });
      expect(client).toBe(mockClient);
    });

    it('should throw if RLS context setting fails', async () => {
      const mockAuth = auth as ReturnType<typeof vi.fn>;
      mockAuth.mockResolvedValue({ userId: 'user-123' });

      const mockRpc = vi.fn().mockResolvedValue({
        error: { message: 'Database error' },
      });
      const { getSupabaseAdmin } = await import('@/lib/integrations/supabase/server');
      const mockClient = {
        rpc: mockRpc,
        from: vi.fn(),
      };
      (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const req = {
        headers: new Headers({
          'x-corso-org-id': 'org-456',
        }),
      } as unknown as NextRequest;

      await expect(getTenantScopedSupabaseClient(req)).rejects.toThrow('Failed to set RLS context');
    });
  });
});

