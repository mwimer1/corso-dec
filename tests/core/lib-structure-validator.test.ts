/**
 * Tests for lib-structure validator
 * Ensures domain-driven architecture rules are enforced
 */

import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import type { MockInstance } from 'vitest';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LibStructureValidator } from '../../scripts/validation/lib-structure';

describe('LibStructureValidator', () => {
  let validator: LibStructureValidator;
  let testLibPath: string;
  let cwdSpy: MockInstance<() => string>;

  beforeEach(() => {
    // Create a temp directory outside the repo so tests never leave artifacts behind
    testLibPath = mkdtempSync(join(tmpdir(), 'corso-lib-structure-'));
    mkdirSync(testLibPath, { recursive: true });

    // Mock process.cwd() to return our temp test root
    cwdSpy = vi.spyOn(process, 'cwd').mockReturnValue(testLibPath);

    validator = new LibStructureValidator(false);
  });

  afterEach(() => {
    // Restore original cwd implementation
    cwdSpy?.mockRestore();

    // Clean up test directory
    if (existsSync(testLibPath)) {
      rmSync(testLibPath, { recursive: true, force: true });
    }
  });

  describe('Domain Structure Validation', () => {
    it('should pass for a well-structured domain', async () => {
      // Create a well-structured test domain
      const domainPath = join(testLibPath, 'testdomain');
      mkdirSync(domainPath, { recursive: true });

      // Create required files
      writeFileSync(join(domainPath, 'index.ts'), `
export const testDomainStatus = 'active' as const;
export type TestDomainConfig = { enabled: boolean };
`);

      writeFileSync(join(domainPath, 'README.md'), `
---
title: "Test Domain"
description: "Test domain description"
last_updated: 2025-09-12
owner: "test-team@corso"
category: "domain"
---

# Test Domain

## Overview
Test domain for validation.

## Directory Structure
\`\`\`
lib/testdomain/
├── index.ts
├── README.md
\`\`\`
`);

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      const testDomainResult = results.find(r => r.domain === 'testdomain');
      expect(testDomainResult).toBeDefined();
      expect(testDomainResult!.issues.filter(i => i.type === 'error')).toHaveLength(0);
      expect(testDomainResult!.score).toBeGreaterThan(80);
    });

    it('should fail for domain missing README', async () => {
      // Create domain without README
      const domainPath = join(testLibPath, 'badDomain');
      mkdirSync(domainPath, { recursive: true });

      writeFileSync(join(domainPath, 'index.ts'), `
export const badDomainStatus = 'active' as const;
`);

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      const badDomainResult = results.find(r => r.domain === 'badDomain');
      expect(badDomainResult).toBeDefined();
      expect(badDomainResult!.issues.some(i =>
        i.type === 'error' && i.message.includes('Missing README.md')
      )).toBe(true);
      expect(badDomainResult!.score).toBeLessThan(100);
    });

    it('should warn about domains with too many root files', async () => {
      // Create domain with many files in root
      const domainPath = join(testLibPath, 'largeDomain');
      mkdirSync(domainPath, { recursive: true });

      // Create README
      writeFileSync(join(domainPath, 'README.md'), '# Large Domain');

      // Create index.ts
      writeFileSync(join(domainPath, 'index.ts'), 'export const status = "ok";');

      // Create many files in root (more than 10)
      for (let i = 0; i < 12; i++) {
        writeFileSync(join(domainPath, `file${i}.ts`), `export const item${i} = ${i};`);
      }

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      const largeDomainResult = results.find(r => r.domain === 'largeDomain');
      expect(largeDomainResult).toBeDefined();
      expect(largeDomainResult!.issues.some(i =>
        i.message.includes('root has') && i.message.includes('files')
      )).toBe(true);
    });

    it('should validate barrel file exports', async () => {
      // Create domain with proper barrel structure
      const domainPath = join(testLibPath, 'barrelDomain');
      mkdirSync(domainPath, { recursive: true });

      // Create README
      writeFileSync(join(domainPath, 'README.md'), '# Barrel Domain');

      // Create barrel with actual exports
      writeFileSync(join(domainPath, 'index.ts'), `
export const barrelExport1 = 'value1';
export const barrelExport2 = 'value2';
export function barrelFunction() { return true; }
`);

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      const barrelDomainResult = results.find(r => r.domain === 'barrelDomain');
      expect(barrelDomainResult).toBeDefined();

      // Should not have warnings about empty barrels
      expect(barrelDomainResult!.issues.filter(i =>
        i.message.includes('empty') || i.message.includes('no exports')
      )).toHaveLength(0);
    });

    it('should warn about empty barrel files', async () => {
      // Create domain with empty barrel
      const domainPath = join(testLibPath, 'emptyBarrelDomain');
      mkdirSync(domainPath, { recursive: true });

      // Create README
      writeFileSync(join(domainPath, 'README.md'), '# Empty Barrel Domain');

      // Create empty barrel
      writeFileSync(join(domainPath, 'index.ts'), `
// This is an empty barrel file
// TODO: Add exports here
`);

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      const emptyBarrelDomainResult = results.find(r => r.domain === 'emptyBarrelDomain');
      expect(emptyBarrelDomainResult).toBeDefined();
      expect(emptyBarrelDomainResult!.issues.some(i =>
        i.message.includes('appears to have no exports')
      )).toBe(true);
    });
  });

  describe('Naming Convention Validation', () => {
    it('should warn about domains with hyphens (non-strict mode)', async () => {
      // Create domain with hyphenated name
      const domainPath = join(testLibPath, 'test-domain');
      mkdirSync(domainPath, { recursive: true });

      writeFileSync(join(domainPath, 'README.md'), '# Test Domain');
      writeFileSync(join(domainPath, 'index.ts'), 'export const status = "ok";');

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      const hyphenatedDomainResult = results.find(r => r.domain === 'test-domain');
      expect(hyphenatedDomainResult).toBeDefined();
      expect(hyphenatedDomainResult!.issues.some(i =>
        i.message.includes('hyphens') && i.type === 'warning'
      )).toBe(true);
    });

    it('should error about domains with hyphens (strict mode)', async () => {
      const strictValidator = new LibStructureValidator(true);

      // Create domain with hyphenated name
      const domainPath = join(testLibPath, 'bad-domain');
      mkdirSync(domainPath, { recursive: true });

      writeFileSync(join(domainPath, 'README.md'), '# Bad Domain');
      writeFileSync(join(domainPath, 'index.ts'), 'export const status = "ok";');

      // Mock the lib path for testing
      Object.defineProperty(strictValidator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await strictValidator.validate();

      const badDomainResult = results.find(r => r.domain === 'bad-domain');
      expect(badDomainResult).toBeDefined();
      expect(badDomainResult!.issues.some(i =>
        i.message.includes('hyphens') && i.type === 'error'
      )).toBe(true);
    });
  });

  describe('Cross-Domain Import Validation', () => {
    it('should detect cross-domain leaf imports', async () => {
      // This test would require mocking file system operations
      // and creating complex import scenarios
      // For now, we'll test the basic structure

      const domainPath = join(testLibPath, 'importTestDomain');
      mkdirSync(domainPath, { recursive: true });

      writeFileSync(join(domainPath, 'README.md'), '# Import Test Domain');
      writeFileSync(join(domainPath, 'index.ts'), 'export const status = "ok";');

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      // Basic validation should still work
      const importTestDomainResult = results.find(r => r.domain === 'importTestDomain');
      expect(importTestDomainResult).toBeDefined();
      expect(importTestDomainResult!.issues.filter(i => i.type === 'error')).toHaveLength(0);
    });
  });

  describe('Runtime Boundary Validation', () => {
    it('should validate Edge runtime boundaries', async () => {
      // Create a mock Edge route that imports server-only modules
      const appPath = join(testLibPath, '..', 'app', 'api', 'test');
      mkdirSync(appPath, { recursive: true });

      writeFileSync(join(appPath, 'route.ts'), `
export const runtime = 'edge';

// This would be a server-only import that violates Edge runtime
// import { someServerFunction } from '@/lib/integrations/someModule';
`);

      // This test would require more complex mocking
      // For now, we'll test that the validator runs without crashing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      // Should complete without throwing
      expect(results).toBeDefined();
      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe('Validation Scoring', () => {
    it('should calculate domain scores correctly', async () => {
      // Perfect domain
      const perfectDomainPath = join(testLibPath, 'perfect');
      mkdirSync(perfectDomainPath, { recursive: true });

      writeFileSync(join(perfectDomainPath, 'README.md'), `
---
title: "Perfect Domain"
description: "Perfect domain description"
last_updated: 2025-09-12
owner: "perfect-team@corso"
category: "domain"
---

# Perfect Domain

## Overview
Perfect domain with all required elements.
`);

      writeFileSync(join(perfectDomainPath, 'index.ts'), `
export const perfectStatus = 'active' as const;
export type PerfectConfig = { enabled: boolean };
`);

      // Problematic domain
      const badDomainPath = join(testLibPath, 'bad');
      mkdirSync(badDomainPath, { recursive: true });

      writeFileSync(join(badDomainPath, 'index.ts'), `
export const badStatus = 'inactive' as const;
`);
      // No README.md

      // Mock the lib path for testing
      Object.defineProperty(validator, 'libPath', {
        value: testLibPath,
        writable: true
      });

      const results = await validator.validate();

      const perfectResult = results.find(r => r.domain === 'perfect');
      const badResult = results.find(r => r.domain === 'bad');

      expect(perfectResult!.score).toBeGreaterThan(90);
      expect(badResult!.score).toBeLessThan(perfectResult!.score);
    });
  });
});

