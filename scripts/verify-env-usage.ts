#!/usr/bin/env tsx
/**
 * Node.js wrapper for verify-env-usage.ps1
 * Cross-platform environment variable usage verification
 *
 * Usage:
 *   pnpm run verify:env
 *   tsx scripts/verify-env-usage.ts
 */

import { existsSync, readFileSync } from 'fs';
import { globby } from 'globby';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const ROOT = resolve(__dirname, '..');

interface Violation {
  file: string;
  issue: string;
  line?: number;
}

async function verifyEnvUsage(): Promise<void> {
  console.log('🔍 Verifying Environment Variable Usage...');
  console.log('Root directory:', ROOT);

  const envFiles = [
    '.env.example',
    '.env.local.example',
    'docs/**/*.md',
  ];

  const sourceFiles = [
    'lib/**/*.ts',
    'app/**/*.ts',
    'components/**/*.ts',
    'hooks/**/*.ts',
  ];

  const violations: Violation[] = [];

  // Check for direct process.env usage (should use getEnv() or similar)
  const files = await globby(sourceFiles, { cwd: ROOT });

  for (const file of files) {
    const filePath = resolve(ROOT, file);
    const content = readFileSync(filePath, 'utf8');

    // Check for direct process.env array access
    const processEnvRegex = /process\.env\[/g;
    if (processEnvRegex.test(content)) {
      // Allow client-side NEXT_PUBLIC_* access in client components
      // This is intentional for Next.js build-time inlining
      const isClientComponent = content.includes("'use client'") || content.includes('"use client"');
      const isNextPublicVar = /process\.env\[['"]NEXT_PUBLIC_/.test(content);
      
      if (isClientComponent && isNextPublicVar) {
        // This is allowed - client components can access NEXT_PUBLIC_* directly
        continue;
      }
      
      violations.push({
        file,
        issue: 'Direct process.env usage detected',
      });
    }
  }

  if (violations.length === 0) {
    console.log('✅ No direct process.env usage found');
  } else {
    console.log(`❌ Found ${violations.length} environment variable usage issues:`);
    for (const violation of violations) {
      console.log(`  - ${violation.file}: ${violation.issue}`);
    }
    process.exit(1);
  }

  // Check for documented environment variables
  const documentedEnvVars = new Set<string>();
  const envFilePatterns = await globby(envFiles, { cwd: ROOT });

  for (const envFile of envFilePatterns) {
    const filePath = resolve(ROOT, envFile);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf8');
      const envVarRegex = /#?\s*([A-Z_][A-Z0-9_]*)/g;
      let match;
      while ((match = envVarRegex.exec(content)) !== null) {
        if (match[1]) {
          documentedEnvVars.add(match[1]);
        }
      }
    }
  }

  // Find used environment variables in source code
  const usedEnvVars = new Set<string>();
  for (const file of files) {
    const filePath = resolve(ROOT, file);
    const content = readFileSync(filePath, 'utf8');

    // Check for process.env.property access
    const processEnvPropRegex = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    let match;
    while ((match = processEnvPropRegex.exec(content)) !== null) {
      if (match[1]) {
        usedEnvVars.add(match[1]);
      }
    }

    // Check for getEnv() usage
    const getEnvRegex = /getEnv\(\)\.([A-Z_][A-Z0-9_]*)/g;
    while ((match = getEnvRegex.exec(content)) !== null) {
      if (match[1]) {
        usedEnvVars.add(match[1]);
      }
    }
  }

  // Check for used but undocumented variables
  const undocumented = [];
  for (const usedVar of usedEnvVars) {
    if (!documentedEnvVars.has(usedVar)) {
      undocumented.push(usedVar);
    }
  }

  if (undocumented.length > 0) {
    console.log('⚠️  Environment variables used but not documented:');
    for (const varName of undocumented) {
      console.log(`  - ${varName}`);
    }
  }

  // Check for sensitive environment variables
  const sensitivePatterns = [
    'SECRET', 'KEY', 'TOKEN', 'PASSWORD', 'PRIVATE',
  ];

  const sensitiveVars = [];
  for (const usedVar of usedEnvVars) {
    for (const pattern of sensitivePatterns) {
      if (usedVar.includes(pattern)) {
        sensitiveVars.push(usedVar);
        break;
      }
    }
  }

  if (sensitiveVars.length > 0) {
    console.log('🔐 Sensitive environment variables found:');
    for (const varName of sensitiveVars) {
      console.log(`  - ${varName}`);
    }
  }

  console.log('✅ Environment variable verification complete');
}

// Run the script when executed directly
verifyEnvUsage().catch(console.error);

