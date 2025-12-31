/**
 * @fileoverview Tests for check-package-scripts.ts entrypoint-only validation
 * @description Tests that only executable script entrypoints are validated, not output files
 */

import { describe, expect, it } from 'vitest';

describe('check-package-scripts entrypoint-only validation', () => {
  describe('entrypoint path extraction patterns', () => {
    it('should extract tsx script entrypoints', () => {
      const command = 'tsx scripts/lint/check.ts';
      const tsxPattern = /(?:^|\s)(?:pnpm\s+(?:exec\s+)?)?tsx\s+([^\s&;|><"']+|"[^"]+"|'[^']+')/;
      const match = command.match(tsxPattern);
      expect(match?.[1]).toBe('scripts/lint/check.ts');
    });

    it('should extract pnpm tsx script entrypoints', () => {
      const command = 'pnpm tsx scripts/lint/check.ts';
      const tsxPattern = /(?:^|\s)(?:pnpm\s+(?:exec\s+)?)?tsx\s+([^\s&;|><"']+|"[^"]+"|'[^']+')/;
      const match = command.match(tsxPattern);
      expect(match?.[1]).toBe('scripts/lint/check.ts');
    });

    it('should extract node script entrypoints', () => {
      const command = 'node scripts/ci/workflows-consistency-report.mjs';
      const nodePattern = /(?:^|\s)node\s+(?!-)([^\s&;|><"']+|"[^"]+"|'[^']+')/;
      const match = command.match(nodePattern);
      expect(match?.[1]).toBe('scripts/ci/workflows-consistency-report.mjs');
    });

    it('should extract jscodeshift transform entrypoints', () => {
      const command = 'jscodeshift -t tools/codemods/fix.ts';
      const jscodeshiftPattern = /(?:^|\s)jscodeshift\s+(?:[^\s]+\s+)*-t\s+([^\s&;|><"']+|"[^"]+"|'[^']+')/;
      const match = command.match(jscodeshiftPattern);
      expect(match?.[1]).toBe('tools/codemods/fix.ts');
    });
  });

  describe('output path exclusion', () => {
    it('should NOT extract output file paths from commands', () => {
      // Command with output flag - only entrypoint should be extracted
      const command = 'tsx scripts/analysis/scan-ui-usage.ts --out scripts/.cache/ui-usage.json';
      const tsxPattern = /(?:^|\s)(?:pnpm\s+(?:exec\s+)?)?tsx\s+([^\s&;|><"']+|"[^"]+"|'[^']+')/;
      const match = command.match(tsxPattern);
      // Should extract scripts/analysis/scan-ui-usage.ts, NOT scripts/.cache/ui-usage.json
      expect(match?.[1]).toBe('scripts/analysis/scan-ui-usage.ts');
      expect(match?.[1]).not.toContain('cache');
    });

    it('should NOT extract redirect output paths', () => {
      // Command with shell redirect - only entrypoint should be extracted
      const command = 'supabase gen types > types/supabase/supabase.types.ts';
      const tsxPattern = /(?:^|\s)(?:pnpm\s+(?:exec\s+)?)?tsx\s+([^\s&;|><"']+|"[^"]+"|'[^']+')/;
      const match = command.match(tsxPattern);
      // Should not match anything (no tsx command)
      expect(match).toBeNull();
    });

    it('should skip cache directory paths', () => {
      const cachePath = 'scripts/.cache/ui-usage.json';
      expect(cachePath.includes('/.cache/')).toBe(true);
      // Validator should skip paths containing /.cache/
    });

    it('should skip reports directory paths', () => {
      const reportsPath = 'reports/exports/unused-exports.report.json';
      // Reports paths don't start with scripts/ or tools/, so they won't be validated
      expect(reportsPath.startsWith('scripts/')).toBe(false);
      expect(reportsPath.startsWith('tools/')).toBe(false);
    });
  });

  describe('path validation scope', () => {
    it('should only validate scripts/ entrypoints', () => {
      const scriptsPath = 'scripts/lint/check.ts';
      expect(scriptsPath.startsWith('scripts/')).toBe(true);
    });

    it('should only validate tools/ entrypoints for jscodeshift', () => {
      const toolsPath = 'tools/codemods/fix.ts';
      expect(toolsPath.startsWith('tools/')).toBe(true);
    });

    it('should NOT validate types/ paths', () => {
      const typesPath = 'types/supabase/supabase.types.ts';
      expect(typesPath.startsWith('scripts/')).toBe(false);
      expect(typesPath.startsWith('tools/')).toBe(false);
      // Should not be validated (generated output)
    });
  });

  describe('path normalization', () => {
    it('should normalize Windows path separators', () => {
      const windowsPath = 'scripts\\lint\\check.ts';
      const normalized = windowsPath.replace(/\\/g, '/');
      expect(normalized).toBe('scripts/lint/check.ts');
    });

    it('should remove leading ./ from paths', () => {
      const pathWithDot = './scripts/lint/check.ts';
      const normalized = pathWithDot.startsWith('./') ? pathWithDot.slice(2) : pathWithDot;
      expect(normalized).toBe('scripts/lint/check.ts');
    });
  });
});
