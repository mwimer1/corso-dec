#!/usr/bin/env tsx

/**
 * @fileoverview Domain Validation Entry Point
 * @description Centralized entry point for domain configuration validation
 */

import { execSync } from 'child_process';

/**
 * Run all domain validation checks
 */
export async function runDomainValidation(): Promise<void> {
  console.log('🔍 Running comprehensive domain validation...');
  
  try {
    // Run basic domain config validation
    console.log('📋 Running domain configuration validation...');
    execSync('pnpm validate:domain:config', { stdio: 'inherit' });
    
    console.log('✅ All domain validation checks passed');
  } catch (error) {
    console.error('❌ Domain validation failed');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runDomainValidation();
}

