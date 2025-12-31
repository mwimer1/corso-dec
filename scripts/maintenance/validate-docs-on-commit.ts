#!/usr/bin/env tsx
// scripts/validate-docs-on-commit.ts
// Validates documentation freshness before allowing commits

import { execFileSync } from 'child_process';

const logger = {
  info: (...a: unknown[]) => console.log('[info]', ...a),
  warn: (...a: unknown[]) => console.warn('[warn]', ...a),
  error: (...a: unknown[]) => console.error('[error]', ...a),
  success: (...a: unknown[]) => console.log('[success]', ...a),
};

// Cross-platform pnpm command (Windows uses pnpm.cmd, Unix uses pnpm)
const PNPM = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

function validateDocsOnCommit() {
  logger.info('🔍 Validating documentation freshness...');

  try {
    // Generate fresh docs index
    // Use execFileSync without shell to avoid shell interpolation issues
    execFileSync(PNPM, ['docs:index'], { stdio: 'inherit' });

    // Check if README.md has uncommitted changes
    // Fix: Use execFileSync with argument array + -- separator to prevent pathspec interpretation.
    // This ensures paths with brackets are treated as literal paths (defense in depth).
    const gitStatus = execFileSync('git', ['status', '--porcelain', '--', 'README.md'], { 
      encoding: 'utf8' 
    });

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

