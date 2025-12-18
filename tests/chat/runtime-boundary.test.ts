import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// Use static analysis to check exports without importing the module
// This avoids evaluating React components and their dependencies
const ROOT = process.cwd();
const pagePath = join(ROOT, 'app/(protected)/dashboard/(with-topbar)/(entities)/[entity]/page.tsx');

describe('chat route runtime boundary', () => {
  it('exports Node runtime and disables caching', () => {
    const src = readFileSync(pagePath, 'utf8');
    const hasRuntime = /export\s+const\s+runtime\s*=\s*['"]nodejs['"]/.test(src);
    const hasDynamic = /export\s+const\s+dynamic\s*=\s*['"]force-dynamic['"]/.test(src);
    const hasRevalidate = /export\s+const\s+revalidate\s*=\s*0\b/.test(src);
    
    expect(hasRuntime, 'runtime should be "nodejs"').toBe(true);
    expect(hasDynamic, 'dynamic should be "force-dynamic"').toBe(true);
    expect(hasRevalidate, 'revalidate should be 0').toBe(true);
  });
});

