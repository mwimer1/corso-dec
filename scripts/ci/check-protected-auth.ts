#!/usr/bin/env tsx
import path from 'node:path';
import type { CheckResult } from './check-common';
import { checkFilesWithPattern, checkLayoutHasExport } from './check-common';
import { printCheckResults, setExitFromResults } from '../utils/report-helpers';

async function main() {
  const root = path.join('app', '(protected)');
  const results = await checkFilesWithPattern(
    [`${root}/**/*.tsx`],
    async (content, filePath): Promise<CheckResult> => {
      // Skip client components (they're exempt)
      if (/['"]use client['"]/.test(content)) {
        return {
          success: true,
          message: `${filePath} is a client component (exempt)`,
        };
      }

      // Only check server pages and layouts
      const isServerPageOrLayout =
        /\bexport\s+default\s+function\s+/.test(content) ||
        /\bexport\s+const\s+runtime\b/.test(content) ||
        /\bgenerateMetadata\b/.test(content);

      if (!isServerPageOrLayout) {
        return {
          success: true,
          message: `${filePath} is not a server page or layout`,
        };
      }

      // Check if file itself has auth
      const hasOwnAuth = /\bauth\s*\(/.test(content);
      if (hasOwnAuth) {
        return {
          success: true,
          message: `${filePath} has auth() call`,
        };
      }

      // Check parent layouts for auth (stop at (protected) boundary)
      const dir = path.dirname(filePath);
      const parentHasAuth = await checkLayoutHasExport(
        dir,
        /\bauth\s*\(/,
        {
          boundaryPredicate: (d) => !d.includes(path.sep + '(protected)'),
        }
      );

      if (parentHasAuth) {
        return {
          success: true,
          message: `${filePath} has auth() via parent layout`,
        };
      }

      return {
        success: false,
        message: `${filePath} missing auth()`,
      };
    }
  );

  // Use standard reporting, but preserve the custom error message format
  const failures = results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.error('Protected server components missing auth():');
    for (const failure of failures) {
      // Extract file path from message (format: "filePath missing auth()")
      const filePath = failure.message.replace(/\s+missing auth\(\)$/, '');
      console.error(' -', path.relative(process.cwd(), filePath));
    }
  } else {
    console.log('✅ All protected server components are guarded by auth() directly or via parent layout');
  }
  
  setExitFromResults(results);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});




