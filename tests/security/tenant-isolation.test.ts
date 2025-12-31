// tests/integration/tenant-isolation.test.ts
// Integration tests for tenant isolation via RLS context
import { mockClerkAuth } from '@/tests/support/mocks';
import { createUser, createOrg } from '@/tests/support/factories';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getTenantContext } from '@/lib/server/db/tenant-context';
import { getTenantScopedSupabaseClient } from '@/lib/server/db/supabase-tenant-client';
import type { NextRequest } from 'next/server';

// Mock Supabase admin client
vi.mock('@/lib/integrations/supabase/server', () => ({
  getSupabaseAdmin: vi.fn(() => ({
    rpc: vi.fn(),
    from: vi.fn(),
  })),
}));

describe('Tenant Isolation', () => {
  const testUser = createUser({ userId: 'user-123' });
  const testOrg = createOrg({ orgId: 'org-456' });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getTenantContext', () => {
    it('should extract orgId from X-Corso-Org-Id header', async () => {
      mockClerkAuth.setup({ userId: testUser.userId });

      const req = {
        headers: new Headers({
          'x-corso-org-id': testOrg.orgId,
        }),
      } as unknown as NextRequest;

      const context = await getTenantContext(req);

      expect(context.orgId).toBe(testOrg.orgId);
      expect(context.userId).toBe(testUser.userId);
    });

    it('should throw if orgId is missing', async () => {
      mockClerkAuth.setup({ userId: testUser.userId });

      const req = {
        headers: new Headers({}),
      } as unknown as NextRequest;

      await expect(getTenantContext(req)).rejects.toThrow('Organization ID required');
    });

    it('should throw if user is not authenticated', async () => {
      mockClerkAuth.setup({ userId: null });

      const req = {
        headers: new Headers({
          'x-corso-org-id': testOrg.orgId,
        }),
      } as unknown as NextRequest;

      await expect(getTenantContext(req)).rejects.toThrow('User not authenticated');
    });
  });

  describe('getTenantScopedSupabaseClient', () => {
    it('should set RLS context before returning client', async () => {
      mockClerkAuth.setup({ userId: testUser.userId });

      const mockRpc = vi.fn().mockResolvedValue({ error: null });
      const { getSupabaseAdmin } = await import('@/lib/integrations/supabase/server');
      const mockClient = {
        rpc: mockRpc,
        from: vi.fn(),
      };
      (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const req = {
        headers: new Headers({
          'x-corso-org-id': testOrg.orgId,
        }),
      } as unknown as NextRequest;

      const client = await getTenantScopedSupabaseClient(req);

      expect(mockRpc).toHaveBeenCalledWith('set_rls_context', {
        org_id: testOrg.orgId,
        user_id: testUser.userId,
      });
      expect(client).toBe(mockClient);
    });

    it('should throw if RLS context setting fails', async () => {
      mockClerkAuth.setup({ userId: testUser.userId });

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
          'x-corso-org-id': testOrg.orgId,
        }),
      } as unknown as NextRequest;

      await expect(getTenantScopedSupabaseClient(req)).rejects.toThrow('Failed to set RLS context');
    });
  });
});

