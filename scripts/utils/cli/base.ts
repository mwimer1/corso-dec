import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';

export interface BaseCliOptions {
  check?: boolean;
  write?: boolean;
  verbose?: boolean;
  help?: boolean;
}

/**
 * Create base CLI parser with common options
 * Provides consistent CLI interface across scripts
 */
export function createBaseParser(scriptName: string) {
  return yargs(hideBin(process.argv))
    .scriptName(scriptName)
    .option('check', {
      type: 'boolean',
      default: false,
      description: 'Check mode (dry-run, no changes)',
    })
    .option('write', {
      type: 'boolean',
      default: false,
      description: 'Write mode (apply changes)',
    })
    .option('verbose', {
      type: 'boolean',
      default: false,
      alias: 'v',
      description: 'Verbose output',
    })
    .strict()
    .help();
}

/**
 * Common option definitions for reuse
 */
export const commonOptions = {
  check: {
    type: 'boolean' as const,
    default: false,
    description: 'Check mode (dry-run)',
  },
  write: {
    type: 'boolean' as const,
    default: false,
    description: 'Write mode (apply changes)',
  },
  verbose: {
    type: 'boolean' as const,
    default: false,
    alias: 'v' as const,
    description: 'Verbose output',
  },
  dryRun: {
    type: 'boolean' as const,
    default: false,
    description: 'Dry-run mode (show what would change)',
  },
} as const;

