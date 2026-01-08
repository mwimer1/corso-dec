#!/usr/bin/env tsx
/**
 * CSS Audit Reporter
 *
 * Formats and outputs audit results in various formats:
 * - pretty: Human-readable console output
 * - json: Machine-readable JSON
 * - junit: CI-friendly XML format
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Finding, Severity } from './types';
import type { AuditResult } from './orchestrator';
import { logger } from '../../utils/logger';
import chalk from 'chalk';

export type ReportFormat = 'pretty' | 'json' | 'junit';

/**
 * Format finding severity
 */
function formatSeverity(severity: Severity): string {
  switch (severity) {
    case 'error':
      return chalk.red('ERROR');
    case 'warn':
      return chalk.yellow('WARN');
    case 'info':
      return chalk.blue('INFO');
  }
}

/**
 * Pretty print report
 */
function formatPretty(result: AuditResult): string {
  const lines: string[] = [];

  lines.push(chalk.bold('\n📊 CSS Audit Results\n'));
  lines.push('─'.repeat(60));

  // Stats
  lines.push(`\n${chalk.bold('Statistics:')}`);
  lines.push(`  Total findings: ${result.stats.totalFindings}`);
  lines.push(`  New findings: ${chalk.yellow(result.stats.newCount)}`);
  lines.push(`  Suppressed (baseline): ${chalk.gray(result.stats.suppressedCount)}`);

  lines.push(`\n${chalk.bold('By Severity:')}`);
  lines.push(`  Errors: ${chalk.red(result.stats.bySeverity.error)}`);
  lines.push(`  Warnings: ${chalk.yellow(result.stats.bySeverity.warn)}`);
  lines.push(`  Info: ${chalk.blue(result.stats.bySeverity.info)}`);

  if (Object.keys(result.stats.byTool).length > 0) {
    lines.push(`\n${chalk.bold('By Tool:')}`);
    for (const [tool, count] of Object.entries(result.stats.byTool)) {
      lines.push(`  ${tool}: ${count}`);
    }
  }

  // Findings
  if (result.findings.length > 0) {
    lines.push(`\n${chalk.bold('Findings:')}\n`);

    // Group by file
    const byFile = new Map<string, Finding[]>();
    for (const finding of result.findings) {
      const file = finding.file || '<unknown>';
      if (!byFile.has(file)) {
        byFile.set(file, []);
      }
      byFile.get(file)!.push(finding);
    }

    for (const [file, findings] of byFile.entries()) {
      lines.push(chalk.underline(file));
      for (const finding of findings) {
        const severity = formatSeverity(finding.severity);
        const location = finding.line
          ? `:${finding.line}${finding.col ? `:${finding.col}` : ''}`
          : '';
        lines.push(`  ${severity} ${finding.ruleId}${location}`);
        lines.push(`    ${finding.message}`);
        if (finding.hint) {
          lines.push(`    💡 ${chalk.gray(finding.hint)}`);
        }
      }
      lines.push('');
    }
  } else {
    lines.push(`\n${chalk.green('✅ No issues found!')}\n`);
  }

  return lines.join('\n');
}

/**
 * JSON report format
 */
function formatJson(result: AuditResult): string {
  return JSON.stringify(
    {
      summary: result.stats,
      findings: result.findings,
      suppressed: result.suppressed,
    },
    null,
    2
  );
}

/**
 * JUnit XML report format (for CI)
 */
function formatJunit(result: AuditResult): string {
  const lines: string[] = [];
  lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  lines.push('<testsuites>');
  lines.push(`<testsuite name="css-audit" tests="${result.findings.length}" failures="${result.stats.bySeverity.error + result.stats.bySeverity.warn}" errors="${result.stats.bySeverity.error}">`);

  for (const finding of result.findings) {
    const className = finding.file || '<unknown>';
    const testName = finding.ruleId.replace(/[/:]/g, '_');
    const message = `${finding.message}${finding.hint ? ` - ${finding.hint}` : ''}`;
    const location = finding.line ? `:${finding.line}` : '';

    if (finding.severity === 'error' || finding.severity === 'warn') {
      lines.push(
        `  <testcase classname="${escapeXml(className)}" name="${escapeXml(testName)}">`
      );
      lines.push(
        `    <failure message="${escapeXml(message)}" type="${finding.severity}">`
      );
      lines.push(`      ${escapeXml(`${className}${location}: ${message}`)}`);
      lines.push('    </failure>');
      lines.push('  </testcase>');
    } else {
      lines.push(
        `  <testcase classname="${escapeXml(className)}" name="${escapeXml(testName)}"/>`
      );
    }
  }

  lines.push('</testsuite>');
  lines.push('</testsuites>');

  return lines.join('\n');
}

/**
 * Escape XML special characters
 */
function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Generate and write report
 */
export function generateReport(
  result: AuditResult,
  format: ReportFormat,
  outputPath?: string
): string {
  let report: string;

  switch (format) {
    case 'pretty':
      report = formatPretty(result);
      break;
    case 'json':
      report = formatJson(result);
      break;
    case 'junit':
      report = formatJunit(result);
      break;
    default:
      report = formatPretty(result);
  }

  // Write to file if output path provided
  if (outputPath) {
    const dir = dirname(outputPath);
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
    writeFileSync(outputPath, report, 'utf8');
    logger.info(`Report written to: ${outputPath}`);
  } else if (format === 'pretty') {
    // Print to console for pretty format
    console.log(report);
  }

  return report;
}
