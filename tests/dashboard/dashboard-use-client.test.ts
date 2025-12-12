import * as fs from 'fs';
import * as path from 'path';
import { describe, expect, it } from 'vitest';

function listFiles(dir: string, exts = ['.ts', '.tsx']): string[] {
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

function firstMeaningfulLine(content: string): string | null {
  const lines = content.split(/\r?\n/);
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (l.startsWith('//')) continue;
    if (l.startsWith('/*')) {
      // skip block comment header
      if (!l.includes('*/')) continue;
      else if (l.endsWith('*/')) continue;
    }
    return l;
  }
  return null;
}

describe('"use client" boundary in dashboard components', () => {
  it('any file using React hooks under components/dashboard/** must start with "use client"', () => {
    const root = path.resolve(process.cwd());
    const dir = path.join(root, 'components', 'dashboard');
    if (!fs.existsSync(dir)) {
      // Nothing to check if the dashboard folder does not exist
      expect(true).toBe(true);
      return;
    }

    const files = listFiles(dir);
    const hookRegex = /\buse(State|Effect|Ref|Callback|Memo|Reducer|Transition|Optimistic)\b/;
    const offenders: string[] = [];

    for (const file of files) {
      const content = fs.readFileSync(file, 'utf8');
      if (!hookRegex.test(content)) continue;

      const first = firstMeaningfulLine(content) || '';
      const isClient =
        /^['"]use client['"];?$/.test(first) ||
        // allow next-line directive if using a shebang or pragma on the very first line
        content.split(/\r?\n/).slice(0, 5).some(l => /^['"]use client['"];?$/.test(l.trim()));

      if (!isClient) offenders.push(file);
    }

    expect(offenders, `Missing "use client" in files that use React hooks:\n${offenders.map(f => `- ${f}`).join('\n')}`).toEqual([]);
  });
});

