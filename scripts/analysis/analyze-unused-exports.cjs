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
const DEFAULT_REPORT_PATH = path.join(REPORTS_ROOT, "exports", "unused-exports.report.json");
const reportPath = arg("--in", DEFAULT_REPORT_PATH);

const showAll = argv.includes('--all');
const limitArg = argv.find((a) => a.startsWith('--limit='));
const parsedLimit = limitArg ? Number(limitArg.split('=')[1]) : NaN;
const LIMIT = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 5;

try {
  // Read the unused exports report from reports/exports/
  let rawData = '';
  let data;
  try {
    rawData = fs.readFileSync(reportPath, 'utf8');
    data = JSON.parse(rawData);
  } catch (error) {
    console.error('Could not read from', reportPath, ':', error.message);
    // Fallback to legacy knip-baseline.json for backward compatibility
    try {
      console.log('Falling back to knip-baseline.json...');
      rawData = fs.readFileSync('knip-baseline.json', 'utf8');
      data = JSON.parse(rawData);
    } catch (fallbackError) {
      console.error('JSON parse error:', error.message);
      console.error('Raw data length:', rawData.length);
      console.error('Raw data preview:', rawData.substring(0, 100));
      // For now, use empty data structure for analysis
      data = { issues: [] };
    }
  }

  console.log('=== UNUSED EXPORTS ANALYSIS ===\n');

  // Extract all exports from issues
  const allExports = [];
  const exportsByFile = {};

  if (data.issues) {
    data.issues.forEach(issue => {
      if (issue.exports && issue.exports.length > 0) {
        const filePath = issue.file;
        exportsByFile[filePath] = issue.exports;

        issue.exports.forEach(exp => {
          allExports.push({
            file: filePath,
            name: exp.name,
            line: exp.line,
            col: exp.col
          });
        });
      }
    });
  }

  console.log(`📦 TOTAL UNUSED EXPORTS: ${allExports.length}\n`);

  // Categorize by file type/location
  const categories = {
    types: [],
    components: [],
    lib: [],
    actions: [],
    hooks: [],
    contexts: [],
    styles: [],
    other: []
  };

  Object.entries(exportsByFile).forEach(([filePath, exports]) => {
    const categoryInfo = { file: filePath, exports: exports };

    if (filePath.includes('/types/')) {
      categories.types.push(categoryInfo);
    } else if (filePath.includes('/components/') || filePath.includes('/_components/')) {
      categories.components.push(categoryInfo);
    } else if (filePath.includes('/lib/')) {
      categories.lib.push(categoryInfo);
    } else if (filePath.includes('/actions/')) {
      categories.actions.push(categoryInfo);
    } else if (filePath.includes('/hooks/')) {
      categories.hooks.push(categoryInfo);
    } else if (filePath.includes('/contexts/')) {
      categories.contexts.push(categoryInfo);
    } else if (filePath.includes('/styles/')) {
      categories.styles.push(categoryInfo);
    } else {
      categories.other.push(categoryInfo);
    }
  });

  // Show categorized analysis
  console.log('📂 CATEGORIZED BREAKDOWN:\n');

  Object.entries(categories).forEach(([category, fileInfos]) => {
    if (fileInfos.length > 0) {
      const totalExports = fileInfos.reduce((sum, fileInfo) => sum + fileInfo.exports.length, 0);
      console.log(`${category.toUpperCase()} (${fileInfos.length} files, ${totalExports} exports):`);

      const list = showAll ? fileInfos : fileInfos.slice(0, LIMIT);
      list.forEach((fileInfo, i) => {
        console.log(`  ${i + 1}. ${fileInfo.file} (${fileInfo.exports.length} exports)`);
        const exps = showAll ? fileInfo.exports : fileInfo.exports.slice(0, 3);
        exps.forEach(exp => {
          console.log(`     - ${exp.name} (line ${exp.line})`);
        });
        if (!showAll && fileInfo.exports.length > 3) {
          console.log(`     ... and ${fileInfo.exports.length - 3} more`);
        }
      });

      if (!showAll && fileInfos.length > LIMIT) {
        const remainingFiles = fileInfos.length - LIMIT;
        const remainingExports = fileInfos.slice(LIMIT).reduce((sum, fileInfo) => sum + fileInfo.exports.length, 0);
        console.log(`  ... and ${remainingFiles} more files with ${remainingExports} exports`);
      }
      console.log();
    }
  });

  // High-risk vs low-risk analysis
  console.log('🔍 RISK ANALYSIS:\n');

  const highRiskExports = allExports.filter(exp =>
    exp.file.includes('/lib/') ||
    exp.file.includes('/actions/') ||
    exp.file.includes('/hooks/')
  );

  const componentExports = allExports.filter(exp =>
    exp.file.includes('/components/') ||
    exp.file.includes('/_components/')
  );

  const typeExports = allExports.filter(exp =>
    exp.file.includes('/types/')
  );

  const styleExports = allExports.filter(exp =>
    exp.file.includes('/styles/')
  );

  console.log(`🔴 HIGH RISK (core functionality): ${highRiskExports.length} exports`);
  console.log(`🟡 COMPONENT EXPORTS: ${componentExports.length} exports`);
  console.log(`🟢 TYPE EXPORTS: ${typeExports.length} exports`);
  console.log(`🎨 STYLE EXPORTS: ${styleExports.length} exports`);
  console.log(`⚪ OTHER: ${allExports.length - highRiskExports.length - componentExports.length - typeExports.length - styleExports.length} exports`);

  console.log('\n📋 RECOMMENDED VERIFICATION ORDER:');
  console.log('1. 🔴 Start with HIGH RISK core functionality exports');
  console.log('2. 🟡 Then analyze COMPONENT exports (may be used in stories/tests)');
  console.log('3. 🎨 Check STYLE exports (may be used via CSS-in-JS)');
  console.log('4. 🟢 Finally handle TYPE exports (may be used in type-only imports)');

  // Show sample exports for verification
  console.log('\n🔍 SAMPLE EXPORTS FOR IMMEDIATE VERIFICATION:');

  if (highRiskExports.length > 0) {
    console.log('\nHIGH RISK SAMPLES:');
    (showAll ? highRiskExports : highRiskExports.slice(0, Math.max(1, LIMIT * 2))).forEach((exp, i) => {
      console.log(`  ${i + 1}. ${exp.name} (${exp.file}:${exp.line})`);
    });
  }

  if (componentExports.length > 0) {
    console.log('\nCOMPONENT SAMPLES:');
    (showAll ? componentExports : componentExports.slice(0, LIMIT)).forEach((exp, i) => {
      console.log(`  ${i + 1}. ${exp.name} (${exp.file}:${exp.line})`);
    });
  }

} catch (error) {
  console.error('Error reading knip baseline:', error.message);
  process.exit(1);
}
