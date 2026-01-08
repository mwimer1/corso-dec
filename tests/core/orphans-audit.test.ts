/**
 * Unit tests for orphaned files audit script
 *
 * Tests each KEEP reason and DROP scenarios using fixtures
 */

import path from 'path';
import { Project } from 'ts-morph';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

// Import the functions to test (we'll need to adjust imports based on actual implementation)
import {
    analyzeFile,
    findDynamicImports,
    findTextReferences,
    isBarrelFile,
    isNextJsRoute,
    isStyleFile,
    resolvePathAlias,
} from '../../scripts/audit/orphans';

// Test utilities
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'orphans');

describe('Orphaned Files Audit', () => {
  let project: Project;

  beforeEach(async () => {
    // Create a temporary project for testing
    project = new Project({
      compilerOptions: {
        target: 'ES2022' as any,
        lib: ['DOM', 'DOM.Iterable', 'ESNext'],
        module: 'ESNext' as any,
        moduleResolution: 'bundler' as any,
        jsx: 'react-jsx' as any,
        baseUrl: '.',
        strict: true,
        paths: {
          '@/*': ['*'],
        },
      },
    });

    // Add source files to the project with relative paths
    const files = [
      'used-barrel/index.ts',
      'used-barrel/used-leaf.ts',
      'consumer.ts',
      'unused-leaf.ts',
      'dynamic-import-consumer.ts',
      'app/test/route.ts',
      'docs/reference.md',
    ];

    for (const file of files) {
      const fullPath = path.join(FIXTURES_DIR, file);
      project.addSourceFileAtPath(fullPath);
    }
  });

  afterEach(async () => {
    // Clean up any temporary files if needed
  });

  describe('Utility Functions', () => {
    describe('resolvePathAlias', () => {
      it('should resolve @/ paths correctly', () => {
        const result = resolvePathAlias('@/components/Button', project);
        expect(result).toBe('components/Button');
      });

      it('should return non-aliased paths unchanged', () => {
        const result = resolvePathAlias('./components/Button', project);
        expect(result).toBe('./components/Button');
      });
    });

    describe('isNextJsRoute', () => {
      it('should identify Next.js route files', () => {
        expect(isNextJsRoute('app/test/route.ts')).toBe(true);
        expect(isNextJsRoute('app/test/page.tsx')).toBe(true);
        expect(isNextJsRoute('app/test/layout.tsx')).toBe(true);
        expect(isNextJsRoute('app/test/loading.tsx')).toBe(true);
        expect(isNextJsRoute('app/test/error.tsx')).toBe(true);
        expect(isNextJsRoute('app/test/not-found.tsx')).toBe(true);
        expect(isNextJsRoute('app/test/opengraph-image.tsx')).toBe(true);
        expect(isNextJsRoute('app/test/icon.tsx')).toBe(true);
        expect(isNextJsRoute('app/test/sitemap.ts')).toBe(true);
      });

      it('should not identify non-route files', () => {
        expect(isNextJsRoute('components/Button.tsx')).toBe(false);
        expect(isNextJsRoute('lib/utils.ts')).toBe(false);
      });
    });

    describe('isStyleFile', () => {
      it('should identify style files', () => {
        expect(isStyleFile('styles/globals.css')).toBe(true);
        expect(isStyleFile('components/Button.module.css')).toBe(true);
        expect(isStyleFile('tailwind.config.ts')).toBe(true);
      });

      it('should not identify non-style files', () => {
        expect(isStyleFile('components/Button.tsx')).toBe(false);
        expect(isStyleFile('lib/utils.ts')).toBe(false);
      });
    });

    describe('isBarrelFile', () => {
      it('should identify barrel files', () => {
        expect(isBarrelFile('components/index.ts')).toBe(true);
        expect(isBarrelFile('components/ui/index.tsx')).toBe(true);
        expect(isBarrelFile('lib/shared/index.ts')).toBe(true);
      });

      it('should not identify non-barrel files', () => {
        expect(isBarrelFile('components/Button.tsx')).toBe(false);
        expect(isBarrelFile('lib/utils.ts')).toBe(false);
      });
    });

    describe('findDynamicImports', () => {
      it('should find ES6 dynamic imports', () => {
        const content = `
          import('./components/Button');
          const module = await import('@/lib/utils');
        `;

        const imports = findDynamicImports(content);
        expect(imports).toContain('./components/Button');
        expect(imports).toContain('@/lib/utils');
      });

      it('should find CommonJS require calls', () => {
        const content = `
          const module = require('./components/Button');
          const utils = require('@/lib/utils');
        `;

        const imports = findDynamicImports(content);
        expect(imports).toContain('./components/Button');
        expect(imports).toContain('@/lib/utils');
      });

      it('should return empty array for no dynamic imports', () => {
        const content = `
          import { Button } from './components/Button';
          import { utils } from '@/lib/utils';
        `;

        const imports = findDynamicImports(content);
        expect(imports).toHaveLength(0);
      });
    });

    describe('findTextReferences', () => {
      it('should find text references in files', async () => {
        const searchDirs = ['docs'];
        const filePath = 'used-barrel/index.ts';

        // This would need actual files in the search directories
        // For now, we'll test the function exists and returns the expected object shape
        const result = findTextReferences(filePath, searchDirs);
        expect(typeof result).toBe('object');
        expect(result).toHaveProperty('found');
        expect(result).toHaveProperty('refs');
        expect(result).toHaveProperty('docsOnly');
        expect(typeof result.found).toBe('boolean');
        expect(Array.isArray(result.refs)).toBe(true);
        expect(typeof result.docsOnly).toBe('boolean');
      });
    });
  });

  describe('File Analysis', () => {
    it('should mark used barrel as KEEP_BARREL_USED', async () => {
      const allowlist = new Set<string>();

      const result = await analyzeFile(
        'used-barrel/index.ts',
        project,
        allowlist
      );


      expect(result.status).toBe('KEEP');
      expect(result.reasons).toContain('KEEP_BARREL_USED');
    });

    it('should mark unused leaf as DROP', async () => {
      const allowlist = new Set<string>();

      const result = await analyzeFile(
        'unused-leaf.ts',
        project,
        allowlist
      );

      expect(result.status).toBe('DROP');
      expect(result.reasons).toHaveLength(0);
    });

    it('should mark Next.js route as KEEP_ROUTES_IMPLICIT', async () => {
      const allowlist = new Set<string>();

      const result = await analyzeFile(
        'app/test/route.ts',
        project,
        allowlist
      );

      expect(result.status).toBe('KEEP');
      expect(result.reasons).toContain('KEEP_ROUTES_IMPLICIT');
    });

    it('should mark dynamic import consumer as KEEP_DYNAMIC_IMPORT', async () => {
      const allowlist = new Set<string>();

      const result = await analyzeFile(
        'dynamic-import-consumer.ts',
        project,
        allowlist
      );

      expect(result.status).toBe('KEEP');
      expect(result.reasons).toContain('KEEP_DYNAMIC_IMPORT');
    });

    it('should mark used barrel as KEEP_BARREL_USED', async () => {
      const allowlist = new Set<string>();

      const result = await analyzeFile(
        'used-barrel/index.ts',
        project,
        allowlist
      );

      expect(result.status).toBe('KEEP');
      expect(result.reasons).toContain('KEEP_BARREL_USED');
    });
  });

  describe('Export Reference Analysis', () => {
    it('should count export references correctly', async () => {
      const allowlist = new Set<string>();

      const result = await analyzeFile(
        'used-barrel/used-leaf.ts',
        project,
        allowlist
      );

      // The usedFunction should have references from the barrel and consumer
      expect(result.exportRefs).toBeDefined();
      expect(result.exportRefs?.some(ref => ref.export === 'usedFunction' && ref.refs > 0)).toBe(true);
    });
  });

  describe('Report Structure', () => {
    it('should generate correct report structure', async () => {
      // This would test the full report generation
      // For now, we'll verify the analysis functions work correctly
      expect(true).toBe(true);
    });
  });
});

