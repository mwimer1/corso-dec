// tests/support/setup/vitest.global-setup.ts
import { config } from 'dotenv';
import { resolve } from 'node:path';

// Load .env.test file once before all test workers start
// This prevents the repeated dotenv messages from appearing in test output
config({
  path: resolve(process.cwd(), '.env.test'),
  quiet: true, // Suppress dotenv output messages
});

export default function globalSetup() {
  // This function runs once before all test workers
  // The dotenv config above is executed when this module is imported
  console.log('🔧 Test environment loaded (dotenv quiet mode)');
} 

