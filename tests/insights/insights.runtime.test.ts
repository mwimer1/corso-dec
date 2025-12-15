// Avoid importing the page module directly as it triggers client component imports
// that require React in the Node test environment
import { describe, expect, it } from 'vitest';

describe('insights page runtime', () => {
  it('declares Node runtime for file system operations', async () => {
    // Check the source file directly to avoid importing client components
    const fs = await import('fs');
    const path = await import('path');
    const pagePath = path.resolve(__dirname, '../../app/(marketing)/insights/page.tsx');
    const pageSource = fs.readFileSync(pagePath, 'utf8');
    
    // Verify runtime exports
    expect(pageSource).toContain('export const runtime = "nodejs"');
    // Changed to force-dynamic to support URL query params for category filtering
    expect(pageSource).toContain('export const dynamic = "force-dynamic"');
  });

  it('imports no server-only modules in client components', async () => {
    // Verify the component doesn't import from @/lib/server/**
    // Check the source file directly (avoid importing client component in Node test)
    const fs = await import('fs');
    const path = await import('path');
    const componentPath = path.resolve(__dirname, '../../components/insights/category-filter.tsx');
    const componentSource = fs.readFileSync(componentPath, 'utf8');
    expect(componentSource).not.toContain('@/lib/server/');
    // Verify it's a client component
    expect(componentSource).toContain("'use client'");
  });
});

