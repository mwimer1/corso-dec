import { promises as fs } from 'fs';
import path from 'path';
import { describe, expect, it } from 'vitest';
import baseline from '../../scripts/policies/import-baseline.json';

const aliasRe = /from\s*['"]@\/(?:lib\/)?([\w-]+)(?:\/(.+))?['"]/g;

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) await walk(full, acc);
    else if (e.isFile() && (e.name.endsWith('.ts') || e.name.endsWith('.tsx'))) acc.push(full);
  }
  return acc;
}

function fileDomain(filePath: string): string | null {
  const parts = filePath.split(path.sep);
  const idx = parts.lastIndexOf('lib');
  return idx >= 0 && parts.length > idx + 1 ? parts[idx + 1] : null;
}

/**
 * Strip comments from source code to avoid false positives from import examples in comments
 */
function stripComments(src: string): string {
  // Remove single-line comments (// ...)
  let result = src.replace(/\/\/.*$/gm, '');
  // Remove multi-line comments (/* ... */)
  result = result.replace(/\/\*[\s\S]*?\*\//g, '');
  return result;
}

describe('import discipline', () => {
  it('no new cross-domain leaf imports (baseline enforcement)', async () => {
    const files = await walk(path.resolve(process.cwd(), 'lib'));
    const offenders: string[] = [];
    for (const f of files) {
      const rel = path.relative(process.cwd(), f).replace(/\\/g, '/');
      const src = await fs.readFile(f, 'utf8');
      // Strip comments to avoid false positives from import examples in comments
      const srcWithoutComments = stripComments(src);
      let m: RegExpExecArray | null;
      const srcDomain = fileDomain(f);
      while ((m = aliasRe.exec(srcWithoutComments))) {
        const importDomain = m[1];
        const tail = m[2] || '';
        // Only enforce when crossing domains
        if (srcDomain && importDomain && srcDomain !== importDomain) {
          if (!tail) continue; // '@/lib/<domain>' OK
          if (tail === 'server' || tail === 'client') continue; // entrypoints OK
          offenders.push(`${rel} -> @/${importDomain}/${tail}`);
        }
      }
    }

    // Check for new violations (not in baseline)
    const baselineSet = new Set(baseline.offenders);
    const newOffenders = offenders.filter(o => !baselineSet.has(o));

    expect(newOffenders, `New cross-domain leaf imports found (not in baseline):\n${newOffenders.join('\n')}`).toEqual([]);
  });
});



