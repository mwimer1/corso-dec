/**
 * Standardized logging for lint scripts
 * Re-exports logger from scripts/utils/logger for consistency
 */

export { logger } from '../../utils/logger';

/**
 * Check if JSON output mode is requested
 */
export function isJsonOutput(): boolean {
  return process.argv.includes('--json');
}

/**
 * Format error message consistently
 */
export function formatError(file: string, message: string): string {
  return `${file}: ${message}`;
}

/**
 * Format warning message consistently
 */
export function formatWarning(file: string, message: string): string {
  return `${file}: ${message}`;
}
