import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

function listFiles(dir: string, exts = ['.ts', '.tsx', '.js', '.jsx']): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name.startsWith('.')) continue;
      out.push(...listFiles(p, exts));
    } else {
      if (exts.includes(path.extname(p))) out.push(p);
    }
  }
  return out;
}

describe('AG Grid registration pattern', () => {
  it('no direct ModuleRegistry usage inside components/** (only via vendor register helper)', () => {
    const root = path.resolve(process.cwd());
    const componentsDir = path.join(root, 'components');
    expect(fs.existsSync(componentsDir)).toBe(true);

    const files = listFiles(componentsDir);
    const offenders: { file: string; line: number; text: string }[] = [];
    const allowlistSegments = [
      path.sep + 'lib' + path.sep + 'vendors' + path.sep + 'ag-grid' + path.sep + 'register',
      path.sep + 'tests' + path.sep, // tests may mention it
    ];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (!/ModuleRegistry\s*\./.test(content)) continue;

      const isAllowlisted = allowlistSegments.some(seg => file.includes(seg));
      if (isAllowlisted) continue;

      const lines = content.split(/\r?\n/);
      lines.forEach((ln, idx) => {
        if (ln.includes('ModuleRegistry')) {
          offenders.push({ file, line: idx + 1, text: ln.trim() });
        }
      });
    }

    expect(offenders, `Direct ModuleRegistry found (use ensureAgGridRegistered() via vendor helper):\n${offenders.map(o => `- ${o.file}:${o.line} → ${o.text}`).join('\n')}`).toEqual([]);
  });
});

