#!/usr/bin/env tsx
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { checkFilesWithPattern, checkPublicRouteHasMetadata, reportCheckFailures } from './check-common';

async function fileHasMetadataExports(content: string, filePath: string): Promise<{ success: boolean; message: string; details?: string[] }> {
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

  reportCheckFailures(results, 'Metadata check');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});




