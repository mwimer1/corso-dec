/**
 * Unit tests for auth and RBAC helpers
 * 
 * Tests requireAuth, requireRole, requireAnyRole, and requireAuthWithRBAC
 * to ensure they correctly map authentication/authorization failures to HTTP responses
 * with proper status codes and error payloads.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { requireAuth, requireRole, requireAnyRole, requireAuthWithRBAC } from '@/lib/api/auth-helpers';

// Mock Clerk auth
const mockAuth = vi.fn();
vi.mock('@clerk/nextjs/server', () => ({
  auth: () => mockAuth(),
}));

describe('requireAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return auth context when userId is present', async () => {
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: vi.fn(({ role }: { role: string }) => role === 'member'),
      orgId: 'org-456',
    });

    const result = await requireAuth();

    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.userId).toBe('user-123');
      expect(result.orgId).toBe('org-456');
      expect(typeof result.has).toBe('function');
    }
  });

  it('should return 401 when userId is missing', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      has: vi.fn(),
    });

    const result = await requireAuth();

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('HTTP_401');
      expect(body.error.message).toBe('Unauthorized');
    }
  });

  it('should return 401 when userId is undefined', async () => {
    mockAuth.mockResolvedValue({
      userId: undefined,
      has: vi.fn(),
    });

    const result = await requireAuth();

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error.code).toBe('HTTP_401');
    }
  });
});

describe('requireRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return auth context when user has required role', async () => {
    const mockHas = vi.fn(({ role }: { role: string }) => role === 'member');
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const result = await requireRole('member');

    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.userId).toBe('user-123');
      expect(mockHas).toHaveBeenCalledWith({ role: 'member' });
    }
  });

  it('should return 403 when user lacks required role', async () => {
    const mockHas = vi.fn(({ role }: { role: string }) => role === 'admin');
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const result = await requireRole('member');

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.success).toBe(false);
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Insufficient permissions');
    }
  });

  it('should propagate 401 error from requireAuth', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      has: vi.fn(),
    });

    const result = await requireRole('member');

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401); // Should be 401, not 403
      const body = await result.json();
      expect(body.error.code).toBe('HTTP_401');
    }
  });

  it('should accept optional authResult parameter', async () => {
    const authResult = {
      userId: 'user-123',
      has: vi.fn(({ role }: { role: string }) => role === 'member'),
    };

    const result = await requireRole('member', authResult);

    expect(result).not.toBeInstanceOf(Response);
    expect(mockAuth).not.toHaveBeenCalled(); // Should not call auth() again
  });
});

describe('requireAnyRole', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return auth context when user has at least one allowed role', async () => {
    const mockHas = vi.fn(({ role }: { role: string }) => 
      ['org:member', 'org:admin', 'org:owner'].includes(role)
    );
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const result = await requireAnyRole(['org:member', 'org:admin', 'org:owner']);

    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.userId).toBe('user-123');
    }
  });

  it('should return 403 when user lacks all allowed roles', async () => {
    const mockHas = vi.fn(() => false);
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const result = await requireAnyRole(['org:member', 'org:admin', 'org:owner']);

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.details).toEqual({
        requiredRoles: ['org:member', 'org:admin', 'org:owner'],
      });
    }
  });

  it('should propagate 401 error from requireAuth', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      has: vi.fn(),
    });

    const result = await requireAnyRole(['org:member']);

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
    }
  });

  it('should accept optional authResult parameter', async () => {
    const authResult = {
      userId: 'user-123',
      has: vi.fn(({ role }: { role: string }) => role === 'org:member'),
    };

    const result = await requireAnyRole(['org:member', 'org:admin'], authResult);

    expect(result).not.toBeInstanceOf(Response);
    expect(mockAuth).not.toHaveBeenCalled();
  });
});

describe('requireAuthWithRBAC', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should combine requireAuth and requireRole', async () => {
    const mockHas = vi.fn(({ role }: { role: string }) => role === 'member');
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const result = await requireAuthWithRBAC('member');

    expect(result).not.toBeInstanceOf(Response);
    if (!(result instanceof Response)) {
      expect(result.userId).toBe('user-123');
      expect(mockHas).toHaveBeenCalledWith({ role: 'member' });
    }
  });

  it('should return 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      has: vi.fn(),
    });

    const result = await requireAuthWithRBAC('member');

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
    }
  });

  it('should return 403 when user lacks required role', async () => {
    const mockHas = vi.fn(() => false);
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const result = await requireAuthWithRBAC('member');

    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
    }
  });
});

describe('Behavior equivalence with original routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should match query route error mapping for unauthorized', async () => {
    mockAuth.mockResolvedValue({
      userId: null,
      has: vi.fn(),
    });

    const result = await requireAuthWithRBAC('member');

    // Original route: http.error(401, 'Unauthorized', { code: 'HTTP_401' })
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(401);
      const body = await result.json();
      expect(body.error.code).toBe('HTTP_401');
      expect(body.error.message).toBe('Unauthorized');
    }
  });

  it('should match query route error mapping for forbidden', async () => {
    const mockHas = vi.fn(() => false);
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const result = await requireAuthWithRBAC('member');

    // Original route: http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN' })
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.message).toBe('Insufficient permissions');
    }
  });

  it('should match entity route error mapping for any-role pattern', async () => {
    const mockHas = vi.fn(() => false);
    mockAuth.mockResolvedValue({
      userId: 'user-123',
      has: mockHas,
    });

    const allowedRoles = ['org:member', 'org:admin', 'org:owner'] as const;
    const result = await requireAnyRole(allowedRoles);

    // Original route: http.error(403, 'Insufficient permissions', { code: 'FORBIDDEN', details: { requiredRoles: allowedRoles } })
    expect(result).toBeInstanceOf(Response);
    if (result instanceof Response) {
      expect(result.status).toBe(403);
      const body = await result.json();
      expect(body.error.code).toBe('FORBIDDEN');
      expect(body.error.details).toEqual({
        requiredRoles: ['org:member', 'org:admin', 'org:owner'],
      });
    }
  });
});
