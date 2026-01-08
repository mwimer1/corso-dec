#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Flags: --all to print full lists; --limit=N to change sample size; --in to specify input file
const argv = process.argv.slice(2);

// CLI argument parsing for input file
const arg = (name, fallback) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
};
const REPORTS_ROOT = process.env.REPORTS_ROOT ?? "reports";
const DEFAULT_KNIP_JSON = path.join(REPORTS_ROOT, "dependencies", "knip.json");
const knipJsonPath = arg("--in", DEFAULT_KNIP_JSON);
const showAll = argv.includes('--all');
const limitArg = argv.find((a) => a.startsWith('--limit='));
const parsedLimit = limitArg ? Number(limitArg.split('=')[1]) : NaN;
const LIMIT = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 10;
const LIMIT_FILES_LIST = LIMIT;
const LIMIT_DUPLICATES = Math.max(1, Math.floor(LIMIT / 2));

try {
  // Read the knip baseline JSON report from reports/dependencies/
  let raw = '';
  try {
    raw = fs.readFileSync(knipJsonPath, 'utf8');
  } catch {
    // Fallback to legacy locations for backward compatibility
    try {
      raw = fs.readFileSync('knip-baseline.json', 'utf8');
    } catch {
      raw = fs.readFileSync('knip-baseline-clean.json', 'utf8');
    }
  }
  const data = JSON.parse(raw);

  console.log('=== KNIP BASELINE ANALYSIS ===\n');

  // Count unused files
  console.log(`📁 UNUSED FILES: ${data.files.length}`);
  const fileList = showAll ? data.files : data.files.slice(0, LIMIT_FILES_LIST);
  console.log(`First ${showAll ? data.files.length : LIMIT_FILES_LIST} unused files:`);
  fileList.forEach((file, i) => {
    console.log(`  ${i + 1}. ${file}`);
  });
  if (!showAll && data.files.length > LIMIT_FILES_LIST) {
    console.log(`  ... and ${data.files.length - LIMIT_FILES_LIST} more`);
  }
  console.log();

  // Analyze issues by type
  console.log('📊 ISSUES BY TYPE:');

  const buckets = {
    unusedDependencies: [],
    unusedDevDependencies: [],
    unusedExports: [],
    unusedTypes: [],
    unlistedDependencies: [],
    binaries: [],
    duplicates: []
  };

  // Process each issue
  data.issues.forEach(issue => {
    if (issue.dependencies?.length > 0) {
      buckets.unusedDependencies.push(...issue.dependencies.map(dep => ({
        file: issue.file,
        name: dep.name,
        line: dep.line
      })));
    }

    if (issue.devDependencies?.length > 0) {
      buckets.unusedDevDependencies.push(...issue.devDependencies.map(dep => ({
        file: issue.file,
        name: dep.name,
        line: dep.line
      })));
    }

    if (issue.exports?.length > 0) {
      buckets.unusedExports.push(...issue.exports.map(exp => ({
        file: issue.file,
        name: exp.name,
        line: exp.line
      })));
    }

    if (issue.types?.length > 0) {
      buckets.unusedTypes.push(...issue.types.map(type => ({
        file: issue.file,
        name: type.name,
        line: type.line
      })));
    }

    if (issue.unlisted?.length > 0) {
      buckets.unlistedDependencies.push(...issue.unlisted.map(dep => ({
        file: issue.file,
        name: dep.name
      })));
    }

    if (issue.binaries?.length > 0) {
      buckets.binaries.push(...issue.binaries.map(bin => ({
        file: issue.file,
        name: bin.name
      })));
    }

    if (issue.duplicates?.length > 0) {
      buckets.duplicates.push(...issue.duplicates.map(dup => ({
        file: issue.file,
        items: dup
      })));
    }
  });

  // Print bucket summaries
  Object.entries(buckets).forEach(([bucket, items]) => {
    console.log(`  ${bucket}: ${items.length} items`);
  });

  console.log('\n=== TRIAGE PRIORITIES ===\n');

  // 1. Unused Dependencies (safest to remove)
  if (buckets.unusedDependencies.length > 0) {
    console.log('🔴 UNUSED DEPENDENCIES (High Priority - Safe to Remove):');
    buckets.unusedDependencies.forEach(dep => {
      console.log(`  - ${dep.name} (in ${dep.file})`);
    });
    console.log();
  }

  // 2. Unused Dev Dependencies
  if (buckets.unusedDevDependencies.length > 0) {
    console.log('🟡 UNUSED DEV DEPENDENCIES (Medium Priority):');
    buckets.unusedDevDependencies.forEach(dep => {
      console.log(`  - ${dep.name} (in ${dep.file})`);
    });
    console.log();
  }

  // 3. Sample of unused exports (most complex)
  if (buckets.unusedExports.length > 0) {
    console.log('🟠 UNUSED EXPORTS (Complex - Need Analysis):');
    const exps = showAll ? buckets.unusedExports : buckets.unusedExports.slice(0, LIMIT);
    exps.forEach(exp => {
      console.log(`  - ${exp.name} (in ${exp.file}:${exp.line})`);
    });
    if (!showAll && buckets.unusedExports.length > LIMIT) {
      console.log(`  ... and ${buckets.unusedExports.length - LIMIT} more`);
    }
    console.log();
  }

  // 4. Duplicates
  if (buckets.duplicates.length > 0) {
    console.log('🔵 DUPLICATES (Need Refactoring):');
    const dups = showAll ? buckets.duplicates : buckets.duplicates.slice(0, LIMIT_DUPLICATES);
    dups.forEach(dup => {
      console.log(`  - In ${dup.file}: ${dup.items.length} duplicate items`);
    });
    console.log();
  }

  console.log('=== RECOMMENDED WORKFLOW ===\n');
  console.log('1. Start with unusedDependencies (safest)');
  console.log('2. Handle unusedDevDependencies');
  console.log('3. Analyze unusedFiles with safety checks');
  console.log('4. Review unusedExports (most complex)');
  console.log('5. Address duplicates');

} catch (error) {
  console.error('Error analyzing knip baseline:', error.message);
  process.exit(1);
}
