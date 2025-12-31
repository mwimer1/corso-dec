#!/usr/bin/env tsx
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { CheckResult } from './check-common';
import { checkFilesWithPattern, checkPublicRouteHasMetadata } from './check-common';
import { printCheckResults } from '../utils/report-helpers';

async function fileHasMetadataExports(content: string, filePath: string): Promise<CheckResult> {
  const hasMetadata = /export\s+const\s+metadata\s*=/.test(content) || /export\s+async\s+function\s+generateMetadata\s*\(/.test(content);
  
  if (hasMetadata) {
    return { success: true, message: `${filePath} has metadata exports` };
  }
  
  return { success: false, message: `${filePath} missing metadata exports` };
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const appRoot = 'app';
  const publicRoots = [
    path.join(appRoot, '(marketing)'),
  ];

  const results = await checkFilesWithPattern(
    publicRoots.map(root => `${root}/**/page.tsx`),
    async (content, filePath) => {
      const hasOwn = await fileHasMetadataExports(content, filePath);
      if (hasOwn.success) return hasOwn;
      
      const dir = path.dirname(filePath);
      const hasParent = await checkPublicRouteHasMetadata(dir);
      if (hasParent) {
        return { success: true, message: `${filePath} has metadata via parent layout` };
      }
      
      return { success: false, message: `${filePath} missing metadata exports` };
    }
  );

  printCheckResults(results, 'Metadata check');
  
  const failures = results.filter(r => !r.success);
  if (failures.length > 0) {
    process.exit(1);
  }
  
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




