/**
 * @fileoverview Test data factories
 * @description Centralized factories for creating test data with sensible defaults
 * 
 * Usage:
 * ```typescript
 * import { createUser, createOrg, createQueryRequest } from '@/tests/support/factories';
 * 
 * const user = createUser({ userId: 'custom-id' });
 * const org = createOrg({ name: 'Custom Org' });
 * const request = createQueryRequest({ sql: 'SELECT * FROM projects' });
 * ```
 */

/**
 * User factory - creates test user data
 */
export interface UserData {
  userId: string;
  email?: string;
  name?: string;
  orgId?: string;
  orgRole?: string;
}

export function createUser(overrides: Partial<UserData> = {}): UserData {
  const id = overrides.userId || `test-user-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  return {
    userId: id,
    email: overrides.email || `user-${id}@example.com`,
    name: overrides.name || `Test User ${id}`,
    orgId: overrides.orgId || `test-org-${id}`,
    orgRole: overrides.orgRole || 'org:member',
    ...overrides,
  };
}

/**
 * Organization factory - creates test organization data
 */
export interface OrgData {
  orgId: string;
  name: string;
  slug?: string;
}

export function createOrg(overrides: Partial<OrgData> = {}): OrgData {
  const id = overrides.orgId || `test-org-${Date.now()}-${Math.random().toString(36).substring(7)}`;
  
  return {
    orgId: id,
    name: overrides.name || `Test Organization ${id}`,
    slug: overrides.slug || `test-org-${id}`,
    ...overrides,
  };
}

/**
 * Query request factory - creates test query request data
 */
export interface QueryRequestData {
  sql?: string;
  question?: string;
  prompt?: string;
  query?: string;
  orgId?: string;
  userId?: string;
}

export function createQueryRequest(overrides: Partial<QueryRequestData> = {}): QueryRequestData {
  return {
    sql: overrides.sql || 'SELECT * FROM projects LIMIT 10',
    question: overrides.question,
    prompt: overrides.prompt,
    query: overrides.query,
    orgId: overrides.orgId || 'test-org-123',
    userId: overrides.userId || 'test-user-123',
    ...overrides,
  };
}
