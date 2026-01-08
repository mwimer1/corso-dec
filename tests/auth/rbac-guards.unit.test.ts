import { assertRole } from '@/lib/auth/authorization/roles';
import { describe, expect, it } from 'vitest';

describe('RBAC Security Tests', () => {
  describe('assertRole', () => {
    it('should allow valid single role', () => {
      expect(() => assertRole('member', 'member')).not.toThrow();
      expect(() => assertRole('admin', 'admin')).not.toThrow();
      expect(() => assertRole('owner', 'owner')).not.toThrow();
    });

    it('should allow valid role in array', () => {
      expect(() => assertRole('member', ['member', 'admin'])).not.toThrow();
      expect(() => assertRole('admin', ['member', 'admin'])).not.toThrow();
    });

    it('should throw FORBIDDEN for invalid role', () => {
      expect(() => assertRole('viewer', 'member')).toThrow('Insufficient role permissions');
      expect(() => assertRole('viewer', 'admin')).toThrow('Insufficient role permissions');
      expect(() => assertRole('invalid-role', 'member')).toThrow('Insufficient role permissions');
    });

    it('should handle null/undefined roles', () => {
      expect(() => assertRole(null, 'member')).toThrow('Insufficient role permissions');
      expect(() => assertRole(undefined, 'member')).toThrow('Insufficient role permissions');
      expect(() => assertRole('', 'member')).toThrow('Insufficient role permissions');
    });
  });
});

