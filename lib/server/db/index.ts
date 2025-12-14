// lib/server/db/index.ts
// Tenant-scoped database client exports
import 'server-only';

export { getTenantScopedSupabaseClient, withTenantClient } from './supabase-tenant-client';
export { getTenantContext, type TenantContext } from './tenant-context';

