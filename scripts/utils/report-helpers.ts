import type { CheckResult } from '../ci/check-common';
import { writeJson } from './fs/write';

/**
 * Print check results summary to console
 */
export function printCheckResults(
  results: CheckResult[],
  checkName: string
): void {
  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const warnings = results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0);

  console.log(`\n📊 ${checkName} Results:`);
  console.log(`   ✅ Passed: ${passed}/${results.length}`);
  console.log(`   ❌ Failed: ${failed}`);
  if (warnings > 0) {
    console.log(`   ⚠️  Warnings: ${warnings}`);
  }

  if (failed > 0) {
    console.log(`\n❌ Failures:`);
    results
      .filter(r => !r.success)
      .forEach(failure => {
        console.log(`   - ${failure.message}`);
        if (failure.details) {
          failure.details.forEach(detail => console.log(`     ${detail}`));
        }
      });
  }

  const allWarnings = results.flatMap(r => r.warnings || []);
  if (allWarnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    allWarnings.forEach(warning => console.log(`   - ${warning}`));
  }

  const allRecommendations = results.flatMap(r => r.recommendations || []);
  if (allRecommendations.length > 0) {
    console.log(`\n💡 Recommendations:`);
    allRecommendations.forEach(rec => console.log(`   - ${rec}`));
  }
}

/**
 * Write JSON report to file
 */
export async function writeJsonReport<T>(
  filePath: string,
  data: T
): Promise<void> {
  await writeJson(filePath, data);
  console.log(`📄 Report written to: ${filePath}`);
}

/**
 * Format summary statistics
 */
export interface SummaryStats {
  total: number;
  passed: number;
  failed: number;
  warnings: number;
}

export function calculateSummary(results: CheckResult[]): SummaryStats {
  return {
    total: results.length,
    passed: results.filter(r => r.success).length,
    failed: results.filter(r => !r.success).length,
    warnings: results.reduce((sum, r) => sum + (r.warnings?.length || 0), 0),
  };
}

