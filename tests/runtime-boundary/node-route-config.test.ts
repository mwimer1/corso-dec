import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const isCode = (p: string) => /\.(ts|tsx)$/.test(p);

function* walk(dir: string): Generator<string> {
  for (const e of readdirSync(dir)) {
    const full = join(dir, e);
    const st = statSync(full);
    if (st.isDirectory()) yield* walk(full);
    else if (isCode(full)) yield full;
  }
}

describe('Node route config invariants', () => {
  it("Node routes set dynamic='force-dynamic' and revalidate=0", () => {
    const offenders: string[] = [];
    for (const f of walk(join(ROOT, 'app'))) {
      if (!/\/route\.ts$/.test(f)) continue;
      const src = readFileSync(f, 'utf8');
      const isNode = /export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(src);
      if (!isNode) continue;
      const hasDynamic = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(src);
      const hasRevalidate = /export\s+const\s+revalidate\s*=\s*0\b/.test(src);
      if (!(hasDynamic && hasRevalidate)) offenders.push(f);
    }
    expect(offenders, `Node route config missing dynamic/revalidate:\n${offenders.join('\n')}`).toHaveLength(0);
  });
});



