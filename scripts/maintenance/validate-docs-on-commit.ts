#!/usr/bin/env tsx
// scripts/validate-docs-on-commit.ts
// Validates documentation freshness before allowing commits

import { execSync } from 'child_process';
const logger = {
  info: (...a: unknown[]) => console.log('[info]', ...a),
  warn: (...a: unknown[]) => console.warn('[warn]', ...a),
  error: (...a: unknown[]) => console.error('[error]', ...a),
  success: (...a: unknown[]) => console.log('[success]', ...a),
};

function validateDocsOnCommit() {
  logger.info('🔍 Validating documentation freshness...');

  try {
    // Generate fresh docs index
    execSync('pnpm docs:index', { stdio: 'inherit' });

    // Check if README.md has uncommitted changes
    const gitStatus = execSync('git status --porcelain README.md', { encoding: 'utf8' });

    if (gitStatus.trim()) {
      logger.error('❌ Documentation index is stale!');
      logger.info('📝 Auto-generated fresh index. Please stage the changes:');
      logger.info('   git add README.md');
      logger.info('   git commit --amend --no-edit');
      process.exit(1);
    }

    logger.success('✅ Documentation index is up-to-date');
  } catch (error) {
    logger.error('❌ Documentation validation failed:', error);
    process.exit(1);
  }
}

async function main() {
  validateDocsOnCommit();
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

