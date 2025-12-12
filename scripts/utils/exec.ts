// scripts/utils/exec.ts
import chalk from 'chalk';
import type { ExecSyncOptions } from 'child_process';
import { execSync } from 'child_process';

/**
 * Executes a command with standardized output and error handling
 * 
 * This utility function provides a consistent way to execute shell commands
 * with proper logging, error handling, and process termination on failure.
 * 
 * @param command - The shell command to execute
 * @param description - Human-readable description of what the command does
 * @param options - Optional execSync options to pass through
 * @throws {Error} When the command fails (and exits process)
 * 
 * @example
 * ```typescript
 * // Basic command execution
 * run('pnpm build', 'Building application');
 * 
 * // Command with custom options
 * run('pnpm test', 'Running tests', { cwd: './tests' });
 * 
 * // Command that might fail
 * run('git status', 'Checking git status');
 * // If git status fails, process will exit with code 1
 * ```
 */
export function run(command: string, description: string, options?: ExecSyncOptions): void {
  console.log(chalk.blue(`📋 ${description}...`));
  try {
    execSync(command, { stdio: 'inherit', ...options });
    console.log(chalk.green(`✅ ${description} completed\n`));
  } catch (error) {
    if (error instanceof Error) {
        console.error(chalk.red(`❌ ${description} failed:`), error.message);
    } else {
        console.error(chalk.red(`❌ ${description} failed with an unknown error.`));
    }
    process.exit(1);
  }
}

