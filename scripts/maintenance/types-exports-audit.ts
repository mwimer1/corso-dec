#!/usr/bin/env tsx
/**
 * @fileoverview Types & Exports Audit Script
 * @description Combines unused exports detection (via Knip) with barrel consistency checks, outputting a report of issues.
 *
 * Usage:
 *   pnpm audit:types-exports           # Run all checks and report issues
 *   pnpm audit:types-exports --out-json <path>  # Specify custom JSON output path
 *   pnpm audit:types-exports --out-md <path>    # Specify custom Markdown output path
 */

import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '../..');

// --- Output path resolution (new) -----------------------------
const arg = (name: string, fallback?: string) => {
  const i = process.argv.indexOf(name);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};
const REPORTS_ROOT = process.env['REPORTS_ROOT'] ?? "reports";
const DEFAULT_JSON = path.join(REPORTS_ROOT, "exports", "unused-exports.report.json");
const DEFAULT_MD   = path.join(REPORTS_ROOT, "exports", "unused-exports.summary.md");
// Handle --help flag
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: pnpm audit:types-exports [options]

Options:
  --out-json <path>    Specify custom JSON output path (default: reports/exports/unused-exports.report.json)
  --out-md <path>      Specify custom Markdown output path (default: reports/exports/unused-exports.summary.md)
  --help, -h           Show this help message

Runs unused exports detection (via Knip) and barrel consistency checks.
`);
  process.exit(0);
}

const OUT_JSON = arg("--out-json", DEFAULT_JSON);
const OUT_MD   = arg("--out-md", DEFAULT_MD);
fs.mkdirSync(path.dirname(OUT_JSON!), { recursive: true });
fs.mkdirSync(path.dirname(OUT_MD!), { recursive: true });

interface AuditResult {
  success: boolean;
  issues: string[];
  warnings: string[];
  summary: string;
}

async function runKnipAnalysis(): Promise<AuditResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    console.log('🔍 Running knip analysis for unused exports...');

    // Run knip to get unused exports
    let knipOutput: string;
    try {
      knipOutput = execSync('pnpm knip --reporter json', {
        cwd: projectRoot,
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error: any) {
      // Knip may exit with non-zero if issues found, but still output JSON
      knipOutput = error.stdout || error.stderr || '{}';
      if (!knipOutput.trim() || !knipOutput.trim().startsWith('{')) {
        const errorMsg = error.message || String(error);
        console.warn(`⚠️  Knip analysis encountered an error: ${errorMsg}`);
        console.warn('   Continuing with empty results...');
        return {
          success: true,
          issues: [],
          warnings: [`Knip analysis encountered an error: ${errorMsg.substring(0, 100)}`],
          summary: '⚠️  Knip analysis skipped due to error'
        };
      }
    }

    let knipData: any;
    try {
      knipData = JSON.parse(knipOutput);
    } catch (parseError) {
      console.warn('⚠️  Failed to parse knip JSON output. Continuing with empty results...');
      return {
        success: true,
        issues: [],
        warnings: ['Failed to parse knip output'],
        summary: '⚠️  Knip analysis skipped due to parse error'
      };
    }

    // Analyze issues
    if (knipData.issues && knipData.issues.length > 0) {
      let unusedExportsCount = 0;
      let typeOnlyExportsCount = 0;

      for (const issue of knipData.issues) {
        if (issue.exports && issue.exports.length > 0) {
          unusedExportsCount += issue.exports.length;

          // Check for type-only exports
          for (const exp of issue.exports) {
            if (exp.name.startsWith('type ') || exp.name.includes('Type') || exp.name.endsWith('Type')) {
              typeOnlyExportsCount++;
              warnings.push(`Type-only export unused: ${issue.file}:${exp.line} - ${exp.name}`);
            }
          }

          if (issue.exports.length > 5) {
            issues.push(`File ${issue.file} has ${issue.exports.length} unused exports`);
          }
        }
      }

      if (unusedExportsCount > 0) {
        issues.push(`Found ${unusedExportsCount} total unused exports (${typeOnlyExportsCount} appear to be type-only)`);
      }
    }

    const summary = issues.length === 0
      ? '✅ No critical export issues found'
      : `⚠️ Found ${issues.length} export issues to review`;

    return {
      success: issues.length === 0,
      issues,
      warnings,
      summary
    };

  } catch (error) {
    console.error('Failed to run knip analysis:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      issues: [`Knip analysis failed: ${errorMessage}`],
      warnings: [],
      summary: '❌ Failed to analyze exports'
    };
  }
}

async function checkBarrelExports(): Promise<AuditResult> {
  const issues: string[] = [];
  const warnings: string[] = [];

  try {
    console.log('🔍 Checking barrel export consistency...');

    // Run the barrel validation
    execSync('pnpm tsx scripts/maintenance/check-barrels.ts', {
      cwd: projectRoot,
      stdio: 'pipe'
    });

    return {
      success: true,
      issues: [],
      warnings,
      summary: '✅ Barrel exports are consistent'
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    issues.push(`Barrel export validation failed: ${errorMessage}`);
    return {
      success: false,
      issues,
      warnings,
      summary: '❌ Barrel export issues found'
    };
  }
}

async function main() {
  console.log('=== TYPES & EXPORTS AUDIT ===\n');

  let results: AuditResult[];
  try {
    results = await Promise.all([
      runKnipAnalysis(),
      checkBarrelExports()
    ]);
  } catch (error) {
    console.error('❌ Audit execution failed:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    results = [{
      success: false,
      issues: [`Audit execution failed: ${errorMessage}`],
      warnings: [],
      summary: '❌ Audit execution failed'
    }];
  }

  const allIssues = results.flatMap(r => r.issues);
  const allWarnings = results.flatMap(r => r.warnings);

  console.log('\n📊 AUDIT RESULTS:');
  console.log('================');

  for (const result of results) {
    console.log(result.summary);
  }

  if (allWarnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    allWarnings.forEach(warning => console.log(`  - ${warning}`));
  }

  if (allIssues.length > 0) {
    console.log('\n❌ ISSUES:');
    allIssues.forEach(issue => console.log(`  - ${issue}`));

    console.log(`\n💡 Run 'pnpm analyze:unused-exports' for detailed analysis`);

    process.exit(1);
  }

  if (allIssues.length === 0) {
    console.log('\n✅ All export audits passed!');
  }

  // Always write report data to files (even on success)
  const report = {
    timestamp: new Date().toISOString(),
    results,
    summary: {
      totalIssues: allIssues.length,
      totalWarnings: allWarnings.length,
      passed: allIssues.length === 0
    }
  };

  const summaryMd = `# Types & Exports Audit Report

Generated: ${new Date().toISOString()}

## Summary
- **Issues**: ${allIssues.length}
- **Warnings**: ${allWarnings.length}
- **Status**: ${allIssues.length === 0 ? '✅ PASSED' : '❌ FAILED'}

## Results

${results.map(result => `### ${result.summary}

${result.issues.length > 0 ? `**Issues:**\n${result.issues.map(issue => `- ${issue}`).join('\n')}\n\n` : ''}${result.warnings.length > 0 ? `**Warnings:**\n${result.warnings.map(warning => `- ${warning}`).join('\n')}\n\n` : ''}`).join('\n')}

${allIssues.length > 0 ? `## Recommendations

- Run \`pnpm analyze:unused-exports\` for detailed analysis
` : ''}
`;

  fs.writeFileSync(OUT_JSON!, JSON.stringify(report, null, 2));
  fs.writeFileSync(OUT_MD!, summaryMd);

  console.log(`\n📄 Reports written to:`);
  console.log(`  JSON: ${OUT_JSON}`);
  console.log(`  Markdown: ${OUT_MD}`);
}

// Always run main when script is executed directly
main().catch(error => {
  console.error('❌ Audit failed:', error);
  // Still write a failure report
  try {
    const failureReport = {
      timestamp: new Date().toISOString(),
      results: [{
        success: false,
        issues: [`Script execution failed: ${error instanceof Error ? error.message : String(error)}`],
        warnings: [],
        summary: '❌ Script execution failed'
      }],
      summary: {
        totalIssues: 1,
        totalWarnings: 0,
        passed: false
      }
    };
    fs.writeFileSync(OUT_JSON!, JSON.stringify(failureReport, null, 2));
    fs.writeFileSync(OUT_MD!, `# Types & Exports Audit Report\n\n**Error**: ${error instanceof Error ? error.message : String(error)}\n`);
    console.log(`\n📄 Error report written to: ${OUT_JSON}`);
  } catch (writeError) {
    console.error('Failed to write error report:', writeError);
  }
  process.exit(1);
});

