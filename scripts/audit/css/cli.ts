#!/usr/bin/env tsx
/**
 * CSS Audit CLI Entry Point
 *
 * Parses command-line arguments and runs the CSS audit orchestrator.
 */

import { join } from 'node:path';
import type { ResolvedCliOptions, CssAuditTool } from './types';
import { runCssAudit } from './orchestrator';
import { generateReport } from './reporter';
import { allTools } from './tools';
import { getRepoRoot } from '../../lint/_utils/paths';
import { logger } from '../../utils/logger';

/**
 * Parse CLI arguments
 */
function parseArgs(): ResolvedCliOptions {
  const args = process.argv.slice(2);
  const options: Partial<ResolvedCliOptions> = {
    changed: false,
    since: 'HEAD~1',
    include: [],
    exclude: [],
    baselinePath: join(getRepoRoot(), '.css-audit-baseline.json'),
    noBaseline: false,
    updateBaseline: false,
    force: false,
    failOn: 'error',
    strict: false,
    outputPath: '',
    format: 'pretty',
    ci: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    const next = args[i + 1];

    switch (arg) {
      case '--changed':
      case '-c':
        options.changed = true;
        break;

      case '--since':
      case '-s':
        if (next && !next.startsWith('-')) {
          options.since = next;
          i++;
        }
        break;

      case '--include':
      case '-i':
        if (next && !next.startsWith('-')) {
          options.include = (options.include || []).concat(next.split(','));
          i++;
        }
        break;

      case '--exclude':
      case '-e':
        if (next && !next.startsWith('-')) {
          options.exclude = (options.exclude || []).concat(next.split(','));
          i++;
        }
        break;

      case '--tools':
      case '-t':
        if (next && !next.startsWith('-')) {
          options.tools = next.split(',');
          i++;
        }
        break;

      case '--skip-tools':
        if (next && !next.startsWith('-')) {
          options.skipTools = next.split(',');
          i++;
        }
        break;

      case '--baseline':
      case '-b':
        if (next && !next.startsWith('-')) {
          options.baselinePath = next;
          i++;
        }
        break;

      case '--no-baseline':
        options.noBaseline = true;
        break;

      case '--update-baseline':
      case '-u':
        options.updateBaseline = true;
        break;

      case '--force':
      case '-f':
        options.force = true;
        break;

      case '--fail-on':
        if (next && !next.startsWith('-')) {
          options.failOn = next as 'error' | 'warn' | 'info';
          i++;
        }
        break;

      case '--strict':
        options.strict = true;
        options.failOn = 'warn';
        break;

      case '--output':
      case '-o':
        if (next && !next.startsWith('-')) {
          options.outputPath = next;
          i++;
        }
        break;

      case '--format':
        if (next && !next.startsWith('-')) {
          options.format = next as 'pretty' | 'json' | 'junit';
          i++;
        }
        break;

      case '--json':
        options.format = 'json';
        break;

      case '--junit':
        options.format = 'junit';
        break;

      case '--ci':
        options.ci = true;
        options.format = 'junit';
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;

      default:
        if (arg.startsWith('-')) {
          logger.warn(`Unknown option: ${arg}`);
        }
    }
  }

  // Apply defaults
  return {
    changed: options.changed ?? false,
    since: options.since ?? 'HEAD~1',
    include: options.include ?? [],
    exclude: options.exclude ?? [],
    tools: options.tools ?? [],
    skipTools: options.skipTools ?? [],
    baselinePath: options.baselinePath ?? join(getRepoRoot(), '.css-audit-baseline.json'),
    noBaseline: options.noBaseline ?? false,
    updateBaseline: options.updateBaseline ?? false,
    force: options.force ?? false,
    failOn: options.strict ? 'warn' : (options.failOn ?? 'error'),
    strict: options.strict ?? false,
    outputPath: options.outputPath ?? '',
    format: options.format ?? 'pretty',
    ci: options.ci ?? false,
  };
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
CSS Audit Tool

Usage:
  pnpm css:audit [options]

Options:
  --changed, -c              Only check changed files (requires git)
  --since <ref>              Git ref to compare against (default: HEAD~1)
  --include <patterns>       Include only files matching patterns (comma-separated)
  --exclude <patterns>       Exclude files matching patterns (comma-separated)
  --tools <ids>              Run only specific tools (comma-separated)
  --skip-tools <ids>         Skip specific tools (comma-separated)
  --baseline, -b <path>      Baseline file path (default: .css-audit-baseline.json)
  --no-baseline              Don't use baseline (check all findings)
  --update-baseline, -u      Update baseline with current findings
  --force, -f                Enable fix tools (mutating operations)
  --fail-on <level>          Fail on findings at or above level (error|warn|info)
  --strict                   Synonym for --fail-on warn
  --output, -o <path>        Write report to file
  --format <format>          Report format (pretty|json|junit)
  --json                     Shortcut for --format json
  --junit                    Shortcut for --format junit
  --ci                       CI mode (junit format, minimal output)
  --help, -h                 Show this help message

Examples:
  # Run audit on all CSS files
  pnpm css:audit

  # Check only changed files
  pnpm css:audit --changed

  # Update baseline
  pnpm css:audit --update-baseline

  # Run specific tool
  pnpm css:audit --tools css-unused-classes

  # CI mode
  pnpm css:audit --ci --changed

Available Tools:
${allTools.map(t => `  ${t.id}: ${t.title}`).join('\n')}
`);
}

/**
 * Main CLI entry point
 */
async function main(): Promise<void> {
  try {
    const cli = parseArgs();
    
    logger.info('Starting CSS audit...');

    // Run audit
    const result = await runCssAudit(allTools, cli);

    // Generate report
    const outputPath = cli.outputPath || (cli.format !== 'pretty' && cli.ci 
      ? join(getRepoRoot(), 'reports/css-audit/report.' + (cli.format === 'json' ? 'json' : 'xml'))
      : undefined);
    
    // Ensure output directory exists
    if (outputPath) {
      const { mkdirSync, existsSync } = await import('node:fs');
      const { dirname } = await import('node:path');
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
    }
    
    generateReport(result, cli.format, outputPath);

    // Exit with appropriate code
    const hasFailures = cli.failOn === 'error'
      ? result.stats.bySeverity.error > 0
      : cli.failOn === 'warn'
      ? (result.stats.bySeverity.error > 0 || result.stats.bySeverity.warn > 0)
      : result.findings.length > 0;

    if (hasFailures) {
      process.exit(1);
    }
  } catch (error) {
    logger.error('CSS audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
