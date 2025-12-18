#!/usr/bin/env tsx
// scripts/setup/validate-env.ts
// Validates environment variables using consolidated validation utilities

import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load .env.local if it exists (for local development)
config({ path: resolve(process.cwd(), '.env.local') });
// Also try .env as fallback
config({ path: resolve(process.cwd(), '.env') });

// Minimal validation that doesn't require server-only imports
async function main() {
  console.log('🔍 Environment Validation');
  console.log('========================\n');

  try {
    // Basic environment checks that don't require server-only modules
    // Be more lenient for development environments
    const required = ['NODE_ENV'];
    const recommended = ['NEXT_PUBLIC_APP_URL', 'NEXT_PUBLIC_AGGRID_ENTERPRISE'];
    const missingRequired = [];
    const missingRecommended = [];

    for (const envVar of required) {
      if (!process.env[envVar]) {
        missingRequired.push(envVar);
      }
    }

    for (const envVar of recommended) {
      if (!process.env[envVar]) {
        missingRecommended.push(envVar);
      } else if (envVar === 'NEXT_PUBLIC_AGGRID_ENTERPRISE' && process.env[envVar] !== '1') {
        // Special validation for AG Grid Enterprise - must be exactly '1'
        console.log(`⚠️  ${envVar} is set to "${process.env[envVar]}" but should be "1"`);
        missingRecommended.push(envVar);
      }
    }

    if (missingRequired.length === 0) {
      console.log('✅ Basic environment validation passed');
      console.log('   - All required environment variables are properly configured');

      if (missingRecommended.length > 0) {
        console.log(`⚠️  Missing or incorrectly configured recommended variables: ${missingRecommended.join(', ')}`);
        console.log('   - Some features may not work correctly without these variables');

        // Provide specific guidance for NEXT_PUBLIC_APP_URL
        if (missingRecommended.includes('NEXT_PUBLIC_APP_URL')) {
          console.log('');
          console.log('   📋 NEXT_PUBLIC_APP_URL guidance:');
          console.log('      Why it matters: Required for absolute links, emails, and OAuth redirects');
          console.log('      Dev example: http://localhost:3000');
          console.log('      See: docs/reference/env.md for details');
        }

        // Provide specific guidance for NEXT_PUBLIC_AGGRID_ENTERPRISE
        if (missingRecommended.includes('NEXT_PUBLIC_AGGRID_ENTERPRISE')) {
          console.log('');
          console.log('   📋 NEXT_PUBLIC_AGGRID_ENTERPRISE guidance:');
          console.log('      Why it matters: Required for EntityGrid server-side row model');
          console.log('      Value must be: 1 (exactly)');
          console.log('      Location: Add to .env.local file in project root');
          console.log('      Example: NEXT_PUBLIC_AGGRID_ENTERPRISE=1');
          console.log('      Important: Restart dev server after adding/changing NEXT_PUBLIC_* variables');
          console.log('      See: .env.example for reference');
        }
      }
    } else {
      console.error(`❌ Environment validation failed: Missing required variables ${missingRequired.join(', ')}`);
      // Don't exit with error for missing recommended variables in development
      if (missingRecommended.length > 0) {
        console.log(`⚠️  Also missing recommended variables: ${missingRecommended.join(', ')}`);
      }
      // Only fail for missing required variables
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Environment validation failed:');
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main(); 

