#!/usr/bin/env tsx
// scripts/setup/validate-env.ts
// Validates environment variables using consolidated validation utilities

// Minimal validation that doesn't require server-only imports
async function main() {
  console.log('🔍 Environment Validation');
  console.log('========================\n');

  try {
    // Basic environment checks that don't require server-only modules
    // Be more lenient for development environments
    const required = ['NODE_ENV'];
    const recommended = ['NEXT_PUBLIC_APP_URL'];
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
      }
    }

    if (missingRequired.length === 0) {
      console.log('✅ Basic environment validation passed');
      console.log('   - All required environment variables are properly configured');

      if (missingRecommended.length > 0) {
        console.log(`⚠️  Missing recommended variables: ${missingRecommended.join(', ')}`);
        console.log('   - Some features may not work correctly without these variables');

        // Provide specific guidance for NEXT_PUBLIC_APP_URL
        if (missingRecommended.includes('NEXT_PUBLIC_APP_URL')) {
          console.log('');
          console.log('   📋 NEXT_PUBLIC_APP_URL guidance:');
          console.log('      Why it matters: Required for absolute links, emails, and OAuth redirects');
          console.log('      Dev example: http://localhost:3000');
          console.log('      See: docs/reference/env.md for details');
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

