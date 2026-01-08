import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

describe('runtime boundaries - shared barrels must be client-safe', () => {
  it('lib/auth/index.ts should not exist (removed as unused)', () => {
    // lib/auth/index.ts was removed - production code uses /client and /server directly
    const p = path.resolve(__dirname, '../../lib/auth/index.ts');
    expect(() => fs.readFileSync(p)).toThrow('ENOENT');
  });

  it('lib/core/index.ts should not re-export ./server or contain server-only', () => {
    const p = path.resolve(__dirname, '../../lib/core/index.ts');
    const src = fs.readFileSync(p, 'utf8');
    expect(src).not.toMatch(/export\s+\*\s+from\s+['"].*\/server['"]/);
    // Only check for actual 'server-only' imports, not mentions in comments
    expect(src).not.toContain("import 'server-only'");
  });

  it('lib/auth/server/index.ts should not exist (removed as unused)', () => {
    const p = path.resolve(__dirname, '../../lib/auth/server/index.ts');
    expect(() => fs.readFileSync(p)).toThrow('ENOENT');
  });

  it('lib/core/client.ts should exist and be client-safe', () => {
    const p = path.resolve(__dirname, '../../lib/core/client.ts');
    const src = fs.readFileSync(p, 'utf8');
    // Only check for actual 'server-only' imports, not mentions in comments
    expect(src).not.toContain("import 'server-only'");
  });
});

