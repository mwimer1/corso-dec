import * as pageExports from '@/app/(marketing)/insights/page';
import { describe, expect, it } from 'vitest';

describe('insights page runtime', () => {
  it('declares Node runtime for file system operations', () => {
    expect(pageExports.runtime).toBe('nodejs');
    expect(pageExports.dynamic).toBe('force-static');
  });

  it('imports no server-only modules in client components', async () => {
    // Import CategoryFilter and verify no server-only imports
    const CategoryFilter = (await import('@/components/insights/category-filter')).CategoryFilter;
    expect(CategoryFilter).toBeDefined();

    // Verify the component doesn't import from @/lib/server/**
    // Check the source file directly
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../../components/insights/category-filter.tsx');
    const componentSource = fs.readFileSync(componentPath, 'utf8');
    expect(componentSource).not.toContain('@/lib/server/');
  });
});

