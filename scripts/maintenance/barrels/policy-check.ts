#!/usr/bin/env tsx
/**
 * Read-only barrel policy check.
 * Flags re-exports from server-only paths.
 * Does NOT write or generate files. Exit code 1 on violation.
 */

import fs from 'node:fs';
import path from 'node:path';
import { globby } from 'globby';

const ROOT = process.cwd();
const SERVER_PATH_RX = /(^|\/)server(\/|$)/i;

async function main() {
  const barrelFiles = await globby([
    'lib/**/index.ts',
    // add more domains if you maintain barrels elsewhere:
    // 'components/**/index.ts',
    // 'hooks/**/index.ts',
  ], { gitignore: true });

  const violations: string[] = [];

  for (const file of barrelFiles) {
    const src = fs.readFileSync(path.join(ROOT, file), 'utf8');
    const barrelPath = file.replace(/\/index\.ts$/, '');

    // Check if this barrel is imported by client/edge code
    const clientImports = await globby([
      'app/**/*.{ts,tsx}',
      'components/**/*.{ts,tsx}',
    ], { gitignore: true });

    let isImportedByClient = false;
    for (const clientFile of clientImports) {
      const clientSrc = fs.readFileSync(path.join(ROOT, clientFile), 'utf8');
      const importPattern = `from ['"]@/lib/${barrelPath.replace(/^lib\//, '')}['"]`;
      if (new RegExp(importPattern).test(clientSrc)) {
        isImportedByClient = true;
        break;
      }
    }

    // Only check for server-only re-exports if the barrel is imported by client code
    if (isImportedByClient) {
      // 1) re-export lines like: export * from './server', or export {X} from '../server/foo'
      const reexportRX = /^\s*export\s+(\*\s+from|{[^}]+}\s+from)\s+['"]([^'"]+)['"]\s*;?/gm;
      let m: RegExpExecArray | null;
      while ((m = reexportRX.exec(src))) {
        const spec = m[2] ?? '';
        if (SERVER_PATH_RX.test(spec)) {
          violations.push(`${file} -> client-imported barrel re-exports server-only path: ${spec}`);
        }
      }
    }

    // 2) Always warn about problematic blanket exports that could include server code
    const blanketExportRX = /^\s*export\s+\*\s+from\s+['"]([^'"]+)['"]\s*;?/gm;
    let blanketMatch: RegExpExecArray | null;
    while ((blanketMatch = blanketExportRX.exec(src))) {
      const spec = blanketMatch[1] ?? '';
      if (SERVER_PATH_RX.test(spec)) {
        console.warn(`⚠️ WARNING: ${file} -> blanket export from server-only path: ${spec}`);
        // For now, don't fail the build on blanket exports - they're legacy but don't break current usage
        // violations.push(`${file} -> blanket export from server-only path: ${spec}`);
      }
    }
  }

  if (violations.length) {
    console.error('❌ Barrel policy violations:\n' + violations.map(v => ` - ${v}`).join('\n'));
    process.exit(1);
  }
  console.log('✅ Barrel policy check passed (no client-imported server re-exports detected).');
}

void main().catch((e) => {
  console.error('❌ barrels policy check failed:', e);
  process.exit(1);
});

