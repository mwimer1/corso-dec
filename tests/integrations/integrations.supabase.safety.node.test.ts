/**
 * @fileoverview Test that integrations barrel can be imported without env vars
 * @description Ensures Supabase integration doesn't cause import-time side effects
 */

import { describe, expect, it } from 'vitest';

describe('Supabase integration safety', () => {
  it('imports integrations barrel without SUPABASE_* env', async () => {
    // Clear any existing Supabase env vars
    const originalSupabaseUrl = process.env.SUPABASE_URL;
    const originalSupabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    try {
      delete process.env.SUPABASE_URL;
      delete process.env.SUPABASE_SERVICE_ROLE_KEY;

      // This should not throw even without env vars
      const mod = await import('@/lib/integrations');
      expect('supabaseApi' in mod).toBe(true);

      // Verify the supabaseApi object exists but client getter is not called during import
      expect(mod.supabaseApi).toBeDefined();
      expect(typeof mod.supabaseApi).toBe('object');

    } finally {
      // Restore original env vars
      if (originalSupabaseUrl !== undefined) {
        process.env.SUPABASE_URL = originalSupabaseUrl;
      }
      if (originalSupabaseKey !== undefined) {
        process.env.SUPABASE_SERVICE_ROLE_KEY = originalSupabaseKey;
      }
    }
  });
});

