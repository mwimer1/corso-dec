#!/usr/bin/env tsx
/**
 * Cross-platform script to clean .next directory before build
 * Prevents Windows symlink errors in Next.js builds
 */

import { existsSync, rmSync } from 'fs';
import { join } from 'path';

const nextDir = join(process.cwd(), '.next');

if (existsSync(nextDir)) {
  try {
    console.log('🧹 Cleaning .next directory before build...');
    rmSync(nextDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
    console.log('✅ .next directory cleaned successfully');
  } catch (error) {
    const err = error as Error;
    console.warn('⚠️  Warning: Could not fully clean .next directory:', err.message);
    console.warn('   This is usually safe - Next.js will handle partial cleanup');
  }
} else {
  console.log('ℹ️  .next directory does not exist, skipping cleanup');
}

