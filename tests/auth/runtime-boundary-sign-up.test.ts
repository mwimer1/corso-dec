// tests/unit/runtime-boundary/sign-up.runtime.test.ts
import { readFileSync } from 'fs';
import { join } from 'path';

describe('sign-up route runtime boundary', () => {
  it('exports literal runtime config for App Router', () => {
    const filePath = join(process.cwd(), 'app', '(auth)', 'sign-up', '[[...sign-up]]', 'page.tsx');
    const file = readFileSync(filePath, 'utf-8');
    expect(file).toMatch(/export const runtime = 'nodejs';/);
    expect(file).toMatch(/export const dynamic = 'force-dynamic';/);
    expect(file).toMatch(/export const revalidate = 0;/);
  });
});

