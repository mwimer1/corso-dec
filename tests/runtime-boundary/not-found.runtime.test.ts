import { readFileSync } from 'fs';
import { join } from 'path';
import { describe, expect, it } from 'vitest';

describe('not-found runtime boundary', () => {
  it('declares Node runtime with no ISR', () => {
    // Read the not-found.tsx file directly to check its exports
    const filePath = join(process.cwd(), 'app', 'not-found.tsx');
    const fileContent = readFileSync(filePath, 'utf-8');

    expect(fileContent).toContain("export const runtime = 'nodejs'");
    expect(fileContent).toContain("export const dynamic = 'force-dynamic'");
    expect(fileContent).toContain("export const revalidate = 0");
  });
});

