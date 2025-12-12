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
const LIMIT = Number.isFinite(parsedLimit) && parsedLimit > 0 ? parsedLimit : 50;

try {
  // Read the knip baseline JSON report from reports/dependencies/
  let rawData = '';
  let data;
  try {
    rawData = fs.readFileSync(knipJsonPath, 'utf8');
    data = JSON.parse(rawData);
  } catch (error) {
    console.error('Could not read from', knipJsonPath, ':', error.message);
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
      data = { files: [], issues: [] };
    }
  }
  console.log(`✅ Successfully parsed ${data.files?.length || 0} unused files from knip baseline`);

  console.log('=== UNUSED FILES ANALYSIS ===\n');

  const files = data.files || [];
  console.log(`📁 TOTAL UNUSED FILES: ${files.length}\n`);

  // Categorize files by type and directory
  const categories = {
    types: [],
    components: [],
    actions: [],
    lib: [],
    hooks: [],
    app: [],
    tests: [],
    stories: [],
    other: []
  };

  // Better categorization
  const categories2 = {
    config: [],
    test_setup: [],
    storybook: [],
    build: [],
    index_files: [],
    env_files: [],
    tooling: [],
    other: []
  };

  files.forEach(file => {
    if (file.includes('/config/') || file.includes('.config.') || file.includes('.eslintrc') || file.includes('.prettierrc')) {
      categories2.config.push(file);
    } else if (file.includes('test-') || file.includes('-env.') || file.includes('vitest-') || file.includes('/test-')) {
      categories2.test_setup.push(file);
    } else if (file.includes('.storybook/') || file.includes('storybook')) {
      categories2.storybook.push(file);
    } else if (file.includes('build') || file.includes('.mjs') || file.includes('/scripts/')) {
      categories2.build.push(file);
    } else if (file.endsWith('/index.ts') || file.endsWith('/index.tsx')) {
      categories2.index_files.push(file);
    } else if (file.includes('env') || file.includes('process')) {
      categories2.env_files.push(file);
    } else if (file.includes('/config/') || file.includes('.ts') || file.includes('.js')) {
      categories2.tooling.push(file);
    } else {
      categories2.other.push(file);
    }
  });

  // Show detailed file list first 50 files for inspection
  console.log(`📋 FIRST ${showAll ? files.length : LIMIT} UNUSED FILES FOR INSPECTION:`);
  (showAll ? files : files.slice(0, LIMIT)).forEach((file, i) => {
    console.log(`  ${i + 1}. ${file}`);
  });
  if (!showAll && files.length > LIMIT) {
    console.log(`  ... and ${files.length - LIMIT} more`);
  }
  console.log();

  // Show new categorization
  console.log('📂 DETAILED CATEGORIZATION:');
  for (const [category, fileList] of Object.entries(categories2)) {
    if (fileList.length > 0) {
      console.log(`\n${category.toUpperCase().replace('_', ' ')} (${fileList.length} files):`);
      (showAll ? fileList : fileList.slice(0, 8)).forEach((file, i) => {
        console.log(`  ${i + 1}. ${file}`);
      });
      if (!showAll && fileList.length > 8) {
        console.log(`  ... and ${fileList.length - 8} more`);
      }
    }
  }

  files.forEach(file => {
    if (file.includes('/types/')) {
      categories.types.push(file);
    } else if (file.includes('/components/')) {
      categories.components.push(file);
    } else if (file.includes('/actions/')) {
      categories.actions.push(file);
    } else if (file.includes('/lib/')) {
      categories.lib.push(file);
    } else if (file.includes('/hooks/')) {
      categories.hooks.push(file);
    } else if (file.includes('/app/')) {
      categories.app.push(file);
    } else if (file.includes('.test.') || file.includes('/tests/')) {
      categories.tests.push(file);
    } else if (file.includes('.stories.')) {
      categories.stories.push(file);
    } else {
      categories.other.push(file);
    }
  });

  // Print categorized analysis
  for (const [category, fileList] of Object.entries(categories)) {
    if (fileList.length > 0) {
      console.log(`📂 ${category.toUpperCase()} (${fileList.length} files):`);

      // Show first 10 files in each category
      (showAll ? fileList : fileList.slice(0, 10)).forEach((file, i) => {
        console.log(`  ${i + 1}. ${file}`);
      });
      if (!showAll && fileList.length > 10) {
        console.log(`  ... and ${fileList.length - 10} more`);
      }
      console.log();
    }
  }

  // Identify high-risk vs low-risk files
  console.log('🔍 RISK ANALYSIS:');

  const highRisk = files.filter(file =>
    file.includes('/lib/') ||
    file.includes('/actions/') ||
    file.includes('/app/') ||
    file.includes('/hooks/')
  );

  const lowRisk = files.filter(file =>
    file.includes('/types/') ||
    file.includes('.test.') ||
    file.includes('.stories.') ||
    file.includes('/tests/')
  );

  console.log(`🔴 HIGH RISK (core functionality): ${highRisk.length} files`);
  console.log(`🟡 MEDIUM RISK (components): ${categories.components.length} files`);
  console.log(`🟢 LOW RISK (types/tests): ${lowRisk.length} files`);
  console.log(`⚪ OTHER: ${categories.other.length} files`);

  console.log('\n📋 RECOMMENDED ANALYSIS ORDER:');
  console.log('1. 🟢 Start with LOW RISK types and test files');
  console.log('2. 🟡 Then analyze MEDIUM RISK components');
  console.log('3. 🔴 Finally handle HIGH RISK core files with extreme caution');

} catch (error) {
  console.error('Error reading knip baseline:', error.message);
  process.exit(1);
}
