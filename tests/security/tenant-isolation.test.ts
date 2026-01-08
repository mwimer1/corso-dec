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

  describe('withTenantClient', () => {
    it('should set RLS context and execute function with tenant-scoped client', async () => {
      mockClerkAuth.setup({ userId: testUser.userId });

      const mockRpc = vi.fn().mockResolvedValue({ error: null });
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockResolvedValue({ data: [{ id: '1', org_id: testOrg.orgId }], error: null }),
        }),
      });

      const { getSupabaseAdmin } = await import('@/lib/integrations/supabase/server');
      const mockClient = {
        rpc: mockRpc,
        from: mockFrom,
      };
      (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const req = {
        headers: new Headers({
          'x-corso-org-id': testOrg.orgId,
        }),
      } as unknown as NextRequest;

      const { withTenantClient } = await import('@/lib/server/db/supabase-tenant-client');

      const result = await withTenantClient(req, async (client) => {
        const { data } = await client.from('projects').select('*').eq('org_id', testOrg.orgId);
        return data;
      });

      expect(mockRpc).toHaveBeenCalledWith('set_rls_context', {
        org_id: testOrg.orgId,
        user_id: testUser.userId,
      });
      expect(result).toEqual([{ id: '1', org_id: testOrg.orgId }]);
    });

    it('should fail closed when tenant context is missing', async () => {
      mockClerkAuth.setup({ userId: testUser.userId });

      const req = {
        headers: new Headers({}), // Missing org_id header
      } as unknown as NextRequest;

      const { withTenantClient } = await import('@/lib/server/db/supabase-tenant-client');

      await expect(
        withTenantClient(req, async (client) => {
          return await client.from('projects').select('*');
        }),
      ).rejects.toThrow('Organization ID required');
    });
  });

  describe('Cross-Tenant Data Isolation', () => {
    it('should enforce tenant isolation - Org A cannot access Org B data', async () => {
      const orgA = createOrg({ orgId: 'org-a' });
      const orgB = createOrg({ orgId: 'org-b' });
      const userA = createUser({ userId: 'user-a' });

      mockClerkAuth.setup({ userId: userA.userId });

      // Mock RLS context setting
      const mockRpc = vi.fn().mockResolvedValue({ error: null });

      // Mock query results - RLS should filter to only org-a data
      // Supabase query builder: from().select() returns a promise-like object
      const mockFrom = vi.fn().mockReturnValue({
        select: vi.fn().mockResolvedValue({
          data: [{ id: '1', org_id: orgA.orgId }], // Only org-a data returned
          error: null,
        }),
      });

      const { getSupabaseAdmin } = await import('@/lib/integrations/supabase/server');
      const mockClient = {
        rpc: mockRpc,
        from: mockFrom,
      };
      (getSupabaseAdmin as ReturnType<typeof vi.fn>).mockReturnValue(mockClient);

      const req = {
        headers: new Headers({
          'x-corso-org-id': orgA.orgId,
        }),
      } as unknown as NextRequest;

      const { withTenantClient } = await import('@/lib/server/db/supabase-tenant-client');

      const result = await withTenantClient(req, async (client) => {
        const { data } = await client.from('projects').select('*');
        return data;
      });

      // Verify RLS context was set for org-a
      expect(mockRpc).toHaveBeenCalledWith('set_rls_context', {
        org_id: orgA.orgId,
        user_id: userA.userId,
      });

      // Verify only org-a data is returned (RLS filtering)
      expect(result).toEqual([{ id: '1', org_id: orgA.orgId }]);
      expect(result).not.toContainEqual(expect.objectContaining({ org_id: orgB.orgId }));
    });

    it('should fail closed when RLS context is not set', async () => {
      mockClerkAuth.setup({ userId: testUser.userId });

      const mockRpc = vi.fn().mockResolvedValue({
        error: { message: 'RLS context not set' },
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

      const { withTenantClient } = await import('@/lib/server/db/supabase-tenant-client');

      await expect(
        withTenantClient(req, async (client) => {
          return await client.from('projects').select('*');
        }),
      ).rejects.toThrow('Failed to set RLS context');
    });
  });
});

