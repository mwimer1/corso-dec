import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const SRC = resolve(process.cwd(), 'app', '(auth)', 'sign-in', '[[...sign-in]]', 'page.tsx');
const src = readFileSync(SRC, 'utf8');

describe('sign-in route options', () => {
  it('exports runtime=nodejs, dynamic=force-dynamic, revalidate=0', () => {
    expect(src).toMatch(/export const runtime\s*=\s*['"]nodejs['"]/);
    expect(src).toMatch(/export const dynamic\s*=\s*['"]force-dynamic['"]/);
    expect(src).toMatch(/export const revalidate\s*=\s*0\b/);
  });
});

