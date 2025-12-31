// lib/shared/server.ts
// Server-only utilities from the shared domain
// This barrel contains utilities that require Node.js runtime and cannot be used in client/edge code

import 'server-only';

// Server-only environment utilities
export { getEnv, requireServerEnv } from '@/lib/server/env';
// Removed: requireServerEnvVar - unused per dead code audit
export type { ValidatedEnv } from '@/lib/server/env';

// Server-only validation utilities (moved from shared)
export * from '@/lib/server/shared/domain-configs';

// Server-only configuration utilities
// export { metricsCfg } from '../config'; // metricsCfg not found

// Note: Domain validation utilities are now exported directly from root barrel


