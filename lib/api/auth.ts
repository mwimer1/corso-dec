// lib/api/auth.ts
// Edge-safe barrel for API auth helpers.
// This barrel is intentionally empty to keep the Edge barrel safe.
// Routes that need server-only auth helpers should import directly from @/lib/auth/server
// and declare export const runtime = 'nodejs' in their route files.

// Note: Previously this file re-exported requireUserId from @/lib/auth/server,
// but this broke Edge runtime safety. Routes needing server-only auth should:
// 1. Import directly: import { requireUserId } from '@/lib/auth/server';
// 2. Declare runtime: export const runtime = 'nodejs';

// Export empty object to satisfy module requirements
export { };


