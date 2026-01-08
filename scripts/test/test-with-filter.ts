
/**
 * Custom test script that handles --filter flag for pnpm test
 * 
 * Provides intelligent test file discovery and runs tests across all configurations.
 * 
 * Usage: pnpm test --filter "pattern"
 */

import type { SpawnOptions } from 'child_process';
import { spawn } from 'child_process';
import { existsSync, readdirSync } from 'fs';
import { join, resolve } from 'path';

// Get the filter pattern from command line arguments
const args = process.argv.slice(2);
const filterIndex = args.findIndex(arg => arg === '--filter');
const filterPattern = filterIndex !== -1 ? args[filterIndex + 1] : null;

// Remove --filter and its value from args
const cleanArgs = args.filter((arg, index) => {
  if (arg === '--filter') return false;
  if (index === filterIndex + 1) return false;
  return true;
});

// Test configurations to run
const configs = [
    'vitest.config.ts'
] as const;

/**
 * Find a specific test file based on the filter pattern
 * 
 * @param filterPattern - The pattern to search for in test files
 * @returns The path to the found test file or a glob pattern
 */
async function findTestFile(filterPattern: string): Promise<string> {
  // Look for files in tests directory
  const testDirs = ['tests/unit', 'tests/api', 'tests/components'] as const;
  let foundFile: string | null = null;
  
  for (const testDir of testDirs) {
    if (existsSync(testDir)) {
      const files = readdirSync(testDir, { recursive: true });
      for (const file of files) {
        if (typeof file === 'string' && file.includes(filterPattern) && file.endsWith('.test.tsx')) {
          foundFile = join(testDir, file);
          break;
        }
      }
      if (foundFile) break;
    }
  }
  
  if (foundFile) {
    console.log(`✅ Found test file: ${foundFile}`);
    return foundFile;
  } else {
    // Fallback to glob pattern
    const globPattern = `**/*${filterPattern}*.test.{ts,tsx}`;
    console.log(`🔍 Using glob pattern: ${globPattern}`);
    return globPattern;
  }
}

/**
 * Run tests with the specified configuration
 * 
 * @param config - The vitest configuration file to use
 * @param vitestArgs - Additional arguments to pass to vitest
 * @param spawnOptions - Options for the child process
 */
async function runTestConfig(
  config: string,
  vitestArgs: string[], 
  spawnOptions: SpawnOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Use workspace binary to avoid global resolution/extra config loading
    const child = spawn('pnpm', ['exec', 'vitest', ...vitestArgs], spawnOptions);

    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed with code ${code}`));
      }
    });

    child.on('error', reject);
  });
}

/**
 * Main function to run tests across all configurations
 */
async function runTests(): Promise<void> {
  // Find test file if filter is provided
  let vitestPattern: string | null = null;
  if (filterPattern) {
    vitestPattern = await findTestFile(filterPattern);
  }

  const spawnOptions: SpawnOptions = {
    stdio: 'inherit',
    env: {
      ...process.env,
      DOTENV_CONFIG_QUIET: 'true'
    }
  };

  for (const config of configs) {
    const vitestArgs = [
      'run',
      // Use absolute config path to avoid picking up default vitest.config.ts as well
      '--config', resolve(process.cwd(), config),
      '--no-color',
      ...cleanArgs
    ];

    if (vitestPattern) {
      // Use glob pattern directly as arguments
      vitestArgs.push(vitestPattern);
    }

    console.log(`\n🔍 Running tests with config: ${config}`);
    if (vitestPattern) {
      console.log(`📁 Filter pattern: ${vitestPattern}`);
    }

    try {
      await runTestConfig(config, vitestArgs, spawnOptions);
    } catch (error) {
      console.error(`❌ Tests failed for config ${config}:`, error instanceof Error ? error.message : String(error));
      process.exit(1);
    }
  }
}

// Run the tests
runTests().catch((error) => {
  console.error('❌ Test execution failed:', error instanceof Error ? error.message : String(error));
  process.exit(1);
});

