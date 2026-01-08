// scripts/add-barrel-docs-hints.ts
// Adds documentation hints to barrel export files for AI agent context

import {
    addDocumentationHint,
    addFilePathBanner,
    findBarrelFiles
} from './barrel-utils';
import { logger } from './logger';

const DOC_HINTS: Record<string, string> = {
  'components/ui/components/ui/atoms/index.ts':
    '// 📚 Docs: ./docs/BESTPRACTICES.md#barrel-export-management',
  'components/ui/components/ui/components/ui/molecules/index.ts':
    '// 📚 Docs: ./docs/BESTPRACTICES.md#barrel-export-management',
  'components/ui/organisms/index.ts':
    '// 📚 Docs: ./docs/BESTPRACTICES.md#barrel-export-management',
  'lib/index.ts': '// 📚 Docs: ./docs/BESTPRACTICES.md#environment-access-patterns',
  'types/index.ts': '// 📚 Docs: ./docs/BESTPRACTICES.md#type-safety-patterns',
  // Note: hooks/index.ts no longer exists - hooks have been moved to domain homes (components/ui/hooks/, components/chat/hooks/, etc.)
  // Note: actions/index.ts was removed in PR5.2 - Server Actions are now feature-colocated
  // 'actions/index.ts': '// 📚 Docs: ./docs/security/security-policy.md#server-actions',
  'styles/index.ts': '// 📚 Docs: ./docs/VARIANTS.md#design-tokens',
};

async function processBarrelFiles() {
  logger.info('🔍 Scanning for barrel export files...');

  // Find all barrel files using shared utility
  const barrelFiles = await findBarrelFiles({
    ignore: ['node_modules/**', '.next/**', 'dist/**'],
    extensions: ['ts']
  });

  logger.info(`📦 Found ${barrelFiles.length} barrel files`);

  let bannersAdded = 0;
  let hintsAdded = 0;

  for (const file of barrelFiles) {
    logger.info(`📝 Processing ${file}...`);

    // Add file path banner using shared utility
    if (await addFilePathBanner(file)) {
      bannersAdded++;
      logger.success(`  ✅ Added path banner`);
    }

    // Add documentation hint if applicable using shared utility
    if (await addDocumentationHint(file, DOC_HINTS)) {
      hintsAdded++;
      logger.info(`  📚 Added documentation hint`);
    }
  }

  logger.info('\n📊 Summary:');
  logger.info(`  📁 Path banners added: ${bannersAdded}`);
  logger.info(`  📚 Documentation hints added: ${hintsAdded}`);
  logger.info(`  📦 Total files processed: ${barrelFiles.length}`);

  if (bannersAdded > 0 || hintsAdded > 0) {
    logger.info('\n💡 Tip: Run `git diff` to review the changes before committing');
  }
}

processBarrelFiles().catch(console.error);

