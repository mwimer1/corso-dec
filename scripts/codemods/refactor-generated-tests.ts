#!/usr/bin/env tsx
/**
 * Codemod to refactor all generated test files to use the shared test factory
 * This eliminates the massive duplication found by JSCPD analysis
 */

import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';

interface GeneratedTestInfo {
  filePath: string;
  componentName: string;
  componentPath: string;
}

/**
 * Extract component information from generated test file
 */
function extractComponentInfo(content: string, filePath: string): GeneratedTestInfo | null {
  // Extract component import path
  const importMatch = content.match(/import \* as Component from ['"](.+?)['"]/);
  if (!importMatch) return null;
  const importPath = importMatch[1];
  if (!importPath) return null;

  // Extract component name from describe block
  const describeMatch = content.match(/describe\(['"](.+?)['"]/);
  if (!describeMatch) return null;
  const componentName = describeMatch[1];
  if (!componentName) return null;

  return {
    filePath,
    componentName,
    componentPath: importPath,
  };
}

/**
 * Generate the new test content using the factory
 */
function generateNewTestContent(info: GeneratedTestInfo): string {
  const { componentName, componentPath } = info;

  // Determine which factory to use based on component path
  let factoryFunction = 'createComponentTests';
  let defaultProps = '{}';

  if (componentPath.includes('/icon/')) {
    factoryFunction = 'createIconComponentTests';
  } else if (componentPath.includes('/form') || componentPath.includes('/input') || componentPath.includes('/select')) {
    factoryFunction = 'createFormComponentTests';
    defaultProps = '{ onChange: vi.fn() }';
  } else if (componentPath.includes('/table') || componentPath.includes('/chart') || componentPath.includes('/data')) {
    factoryFunction = 'createDataComponentTests';
  }

  if (factoryFunction === 'createComponentTests') {
    return `// @generated - auto-generated skeleton test using shared factory. Remove this line to convert to manual test.
import { createComponentTests } from '@tests/support/test-factories/component-test-factory';
import * as Component from '${componentPath}';

// Use shared test factory to eliminate duplication
createComponentTests({
  componentName: '${componentName}',
  componentImport: Component,
  defaultProps: ${defaultProps},
});
`;
  } else {
    return `// @generated - auto-generated skeleton test using shared factory. Remove this line to convert to manual test.
import { ${factoryFunction} } from '@tests/support/test-factories/component-test-factory';
import * as Component from '${componentPath}';

// Use specialized test factory to eliminate duplication
${factoryFunction}('${componentName}', Component);
`;
  }
}

/**
 * Process all generated test files
 */
async function refactorGeneratedTests() {
  const pattern = 'tests/**/*.gen.test.tsx';
  const files = await glob(pattern);

  console.log(`Found ${files.length} generated test files to refactor`);

  let processed = 0;
  let skipped = 0;

  for (const filePath of files) {
    try {
      const content = readFileSync(filePath, 'utf-8');

      // Skip if already refactored
      if (content.includes('@tests/support/test-factories/component-test-factory')) {
        console.log(`⏭️  Skipping ${filePath} (already refactored)`);
        skipped++;
        continue;
      }

      const info = extractComponentInfo(content, filePath);
      if (!info) {
        console.log(`⚠️  Could not extract info from ${filePath}`);
        skipped++;
        continue;
      }

      const newContent = generateNewTestContent(info);
      writeFileSync(filePath, newContent);

      console.log(`✅ Refactored ${filePath}`);
      processed++;
    } catch (error) {
      console.error(`❌ Error processing ${filePath}:`, error);
      skipped++;
    }
  }

  console.log(`\n📊 Refactoring Summary:`);
  console.log(`✅ Processed: ${processed} files`);
  console.log(`⏭️  Skipped: ${skipped} files`);
  console.log(`📝 Total: ${files.length} files`);
}

/**
 * Main execution
 */
async function main() {
  await refactorGeneratedTests();
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((err) => {
    console.error(err);
    process.exitCode = 1;
  });
}

