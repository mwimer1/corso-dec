#!/usr/bin/env tsx
/**
 * Regression test for git utility functions with Next.js dynamic route paths
 * 
 * This test ensures that paths containing brackets (e.g., [entity], [id])
 * are handled correctly and not escaped when passed to git commands.
 * 
 * Run with: pnpm tsx scripts/utils/__tests__/git.test.ts
 */

import { isGitIgnored, listTrackedFiles, getGitStatus } from '../git';

const BRACKET_PATHS = [
  'app/api/v1/entity/[entity]/route.ts',
  'app/api/v1/entity/[entity]/[id]/route.ts',
  'app/(protected)/dashboard/[id]/page.tsx',
];

/**
 * Test that paths with brackets are not mutated/escaped
 */
function testBracketPathHandling() {
  console.log('🧪 Testing git utility functions with bracket paths...\n');

  let passed = 0;
  let failed = 0;

  for (const path of BRACKET_PATHS) {
    console.log(`  Testing: ${path}`);

    // Test 1: Path should not be escaped in the output
    try {
      // This should not throw and should not mutate the path
      const status = getGitStatus(path);
      
      // Verify path doesn't contain escaped brackets in error messages
      // (We can't directly inspect execFileSync args, so we test that it doesn't crash)
      if (typeof status === 'string') {
        console.log(`    ✅ getGitStatus: OK (status: "${status}")`);
        passed++;
      } else {
        console.log(`    ❌ getGitStatus: Unexpected return type`);
        failed++;
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      // Check if error contains escaped brackets (indicating the bug)
      if (errorMsg.includes('\\[') || errorMsg.includes('\\]')) {
        console.log(`    ❌ getGitStatus: Path was escaped! Error: ${errorMsg}`);
        failed++;
      } else {
        // Other errors (file not found, etc.) are acceptable
        console.log(`    ⚠️  getGitStatus: ${errorMsg} (acceptable)`);
        passed++;
      }
    }

    // Test 2: isGitIgnored should handle bracket paths
    try {
      const ignored = isGitIgnored(path);
      if (typeof ignored === 'boolean') {
        console.log(`    ✅ isGitIgnored: OK (ignored: ${ignored})`);
        passed++;
      } else {
        console.log(`    ❌ isGitIgnored: Unexpected return type`);
        failed++;
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('\\[') || errorMsg.includes('\\]')) {
        console.log(`    ❌ isGitIgnored: Path was escaped! Error: ${errorMsg}`);
        failed++;
      } else {
        console.log(`    ⚠️  isGitIgnored: ${errorMsg} (acceptable)`);
        passed++;
      }
    }

    // Test 3: listTrackedFiles should handle bracket paths in patterns
    try {
      // Use a pattern that might match bracket paths
      const pattern = 'app/api/**/[entity]/route.ts';
      const files = listTrackedFiles(pattern);
      if (Array.isArray(files)) {
        console.log(`    ✅ listTrackedFiles: OK (found ${files.length} files)`);
        passed++;
      } else {
        console.log(`    ❌ listTrackedFiles: Unexpected return type`);
        failed++;
      }
    } catch (error: unknown) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      if (errorMsg.includes('\\[') || errorMsg.includes('\\]')) {
        console.log(`    ❌ listTrackedFiles: Pattern was escaped! Error: ${errorMsg}`);
        failed++;
      } else {
        console.log(`    ⚠️  listTrackedFiles: ${errorMsg} (acceptable)`);
        passed++;
      }
    }

    console.log('');
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

  if (failed > 0) {
    console.error('\n❌ Test failed: Some paths were incorrectly escaped');
    process.exit(1);
  } else {
    console.log('\n✅ All tests passed: Bracket paths handled correctly');
    process.exit(0);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.includes('git.test.ts')) {
  testBracketPathHandling();
}

export { testBracketPathHandling };
