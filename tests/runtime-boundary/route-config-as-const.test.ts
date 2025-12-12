import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const isCode = (p: string) => /\.(ts|tsx)$/.test(p);
const BAD = /export\s+const\s+(runtime|dynamic|revalidate)\s*=\s*[^;]+as\s+const\s*;?/;

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (isCode(full)) yield full;
  }
}

describe('Route config must not use "as const"', () => {
  it('no "as const" on runtime/dynamic/revalidate', () => {
    const offenders: string[] = [];
    for (const f of walk(join(ROOT, 'app'))) {
      const src = readFileSync(f, 'utf8');
      if (BAD.test(src)) offenders.push(f);
    }
    expect(offenders, `"as const" used on route config:\n${offenders.join('\n')}`).toHaveLength(0);
  });
});



