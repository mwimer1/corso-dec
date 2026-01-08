// tests/unit/runtime-boundary/sign-in.runtime.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';

describe('sign-in route runtime boundary', () => {
  it('exports literal runtime config for App Router', () => {
    const filePath = join(process.cwd(), 'app', '(auth)', 'sign-in', '[[...sign-in]]', 'page.tsx');
    const file = readFileSync(filePath, 'utf-8');
    expect(file).toMatch(/export const runtime = 'nodejs';/);
    expect(file).toMatch(/export const dynamic = 'force-dynamic';/);
    expect(file).toMatch(/export const revalidate = 0;/);
  });
});

