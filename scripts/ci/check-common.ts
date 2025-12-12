#!/usr/bin/env tsx
/**
 * Common utilities for CI check scripts
 * Reduces duplication in file checking and validation logic
 */

import { globby } from 'globby';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface CheckResult {
  success: boolean;
  message: string;
  details?: string[];
  warnings?: string[];
  recommendations?: string[];
}

/**
 * Common pattern for checking files exist and have specific content
 */
export async function checkFilesWithPattern(
  pattern: string | string[],
  contentChecker: (content: string, filePath: string) => Promise<CheckResult>
): Promise<CheckResult[]> {
  const patterns = Array.isArray(pattern) ? pattern : [pattern];
  const files = await globby(patterns, { absolute: true });
  const results: CheckResult[] = [];

  for (const file of files) {
    try {
      const content = await fs.readFile(file, 'utf8');
      const result = await contentChecker(content, file);
      results.push(result);
    } catch (error) {
      results.push({
        success: false,
        message: `Failed to read ${file}`,
        details: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  return results;
}

/**
 * Common pattern for checking layout files have specific exports
 */
async function checkLayoutHasExport(
  startDir: string,
  exportPattern: RegExp,
  exportName: string
): Promise<boolean> {
  let dir = startDir;

  while (true) {
    const layout = path.join(dir, 'layout.tsx');
    try {
      await fs.access(layout);
      const content = await fs.readFile(layout, 'utf8');
      if (exportPattern.test(content)) return true;
    } catch {}

    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;

    // Stop climbing outside app directory
    if (!dir.includes(path.sep + 'app' + path.sep)) break;
  }

  return false;
}

/**
 * Common pattern for checking protected routes have auth
 */
async function checkProtectedRouteHasAuth(
  startDir: string,
  authPattern: RegExp = /\bauth\s*\(/
): Promise<boolean> {
  return checkLayoutHasExport(startDir, authPattern, 'auth()');
}

/**
 * Common pattern for checking public routes have metadata
 */
export async function checkPublicRouteHasMetadata(
  startDir: string,
  metadataPattern: RegExp = /export\s+const\s+metadata\s*=|export\s+async\s+function\s+generateMetadata\s*\(/
): Promise<boolean> {
  return checkLayoutHasExport(startDir, metadataPattern, 'metadata');
}

/**
 * Common error reporting for CI checks
 */
export function reportCheckFailures(
  results: CheckResult[],
  checkName: string
): never {
  const failures = results.filter(r => !r.success);

  if (failures.length > 0) {
    console.error(`${checkName} failed:`);
    failures.forEach(failure => {
      console.error(` - ${failure.message}`);
      if (failure.details) {
        failure.details.forEach(detail => console.error(`   ${detail}`));
      }
    });
    process.exit(1);
  }

  console.log(`✅ ${checkName} passed`);
  process.exit(0);
}

// ----- Reporting utilities (merged from check-reporting-common.ts) -----

export interface CheckSummary {
  totalChecks: number;
  passedChecks: number;
  failedChecks: number;
  warnings: number;
  duration: number;
}

function generateCheckSummary(
  results: CheckResult[],
  startTime: number
): CheckSummary {
  const totalChecks = results.length;
  const passedChecks = results.filter(r => r.success).length;
  const failedChecks = totalChecks - passedChecks;
  const warnings = results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0);
  const duration = Date.now() - startTime;
  return { totalChecks, passedChecks, failedChecks, warnings, duration };
}

function formatCheckResults(
  results: CheckResult[],
  checkName: string
): string {
  const summary = generateCheckSummary(results, Date.now());
  let output = `\n📊 ${checkName} Results:\n`;
  output += `   ✅ Passed: ${summary.passedChecks}/${summary.totalChecks}\n`;
  output += `   ❌ Failed: ${summary.failedChecks}\n`;
  output += `   ⚠️  Warnings: ${summary.warnings}\n`;
  output += `   ⏱️  Duration: ${summary.duration}ms\n\n`;

  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    output += `❌ Failures:\n`;
    failures.forEach(failure => {
      output += `   - ${failure.message}\n`;
      if (failure.details) {
        failure.details.forEach(detail => output += `     ${detail}\n`);
      }
    });
    output += `\n`;
  }

  const warnings = results.flatMap(r => r.warnings || []);
  if (warnings.length > 0) {
    output += `⚠️  Warnings:\n`;
    warnings.forEach(warning => output += `   - ${warning}\n`);
    output += `\n`;
  }

  const recommendations = results.flatMap(r => r.recommendations || []);
  if (recommendations.length > 0) {
    output += `💡 Recommendations:\n`;
    recommendations.forEach(rec => output += `   - ${rec}\n`);
    output += `\n`;
  }

  return output;
}

function validateCheckResults(
  results: CheckResult[],
  requiredChecks: string[] = []
): { isValid: boolean; missingChecks: string[] } {
  const requiredResults = results.filter(r =>
    requiredChecks.length === 0 || requiredChecks.includes(r.message)
  );
  const missingChecks = requiredChecks.filter(check =>
    !requiredResults.some(r => r.message.includes(check))
  );
  return {
    isValid: requiredResults.every(r => r.success) && missingChecks.length === 0,
    missingChecks
  };
}

function generateCheckRecommendations(
  results: CheckResult[],
  checkName: string
): string[] {
  const recommendations: string[] = [];
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) recommendations.push(`Fix ${failures.length} failed ${checkName} checks`);
  const warnings = results.filter(r => r.warnings && r.warnings.length > 0);
  if (warnings.length > 0) recommendations.push(`Address ${warnings.length} ${checkName} warnings`);
  if (recommendations.length === 0) recommendations.push(`All ${checkName} checks passed successfully`);
  return recommendations;
}

