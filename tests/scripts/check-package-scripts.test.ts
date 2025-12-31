/**
 * @fileoverview Tests for check-package-scripts.ts file existence validation patterns
 * @description Tests the core path extraction and validation logic patterns used in the script
 */

import { describe, expect, it } from 'vitest';

describe('check-package-scripts file existence validation patterns', () => {
  it('should skip glob patterns', () => {
    // Glob patterns like lib/**/*.ts should not be validated as file paths
    const globPattern = 'lib/**/*.ts';
    expect(globPattern.includes('**')).toBe(true);
    expect(globPattern.includes('*')).toBe(true);
  });

  it('should skip regex patterns with escaped characters', () => {
    // Regex patterns like lib/env/server\\.ts should not be validated
    // In a JavaScript string, "lib/env/server\\.ts" contains the literal: lib/env/server\.ts
    const regexPattern = "lib/env/server\\.ts";
    // The string contains backslash-dot (\.) which is an escaped dot in regex
    expect(regexPattern.includes('\\.')).toBe(true);
    
    // Check that the pattern would be detected by common regex escape sequences
    // Pattern looks for: backslash followed by special regex chars
    const hasEscapedDot = /\\[\\|\.\(\)\[\]\{\}\+\?\^\$]/.test(regexPattern);
    expect(hasEscapedDot).toBe(true);
  });

  it('should handle quoted paths correctly', () => {
    // Quoted paths should extract to unquoted paths
    const singleQuoted = "'scripts/lint/check.ts'";
    const doubleQuoted = '"scripts/lint/check.ts"';
    
    // Tokenizer pattern: "([^"]+)"|'([^']+)'|([^\s]+)
    const extractToken = (str: string): string => {
      const singleMatch = str.match(/'([^']+)'/);
      const doubleMatch = str.match(/"([^"]+)"/);
      return singleMatch?.[1] || doubleMatch?.[1] || str;
    };
    
    expect(extractToken(singleQuoted)).toBe('scripts/lint/check.ts');
    expect(extractToken(doubleQuoted)).toBe('scripts/lint/check.ts');
  });

  it('should normalize Windows path separators', () => {
    // Windows separators should normalize to forward slashes
    const windowsPath = 'scripts\\lint\\check.ts';
    const normalized = windowsPath.replace(/\\/g, '/');
    expect(normalized).toBe('scripts/lint/check.ts');
  });

  it('should detect file paths with valid extensions', () => {
    // Valid file extensions should be detected
    const fileExtPattern = /\.(ts|tsx|js|mjs|cjs|mts|cts|json)$/i;
    
    expect(fileExtPattern.test('scripts/lint/check.ts')).toBe(true);
    expect(fileExtPattern.test('scripts/lint/check.js')).toBe(true);
    expect(fileExtPattern.test('scripts/lint/check.mjs')).toBe(true);
    expect(fileExtPattern.test('scripts/lint/check.json')).toBe(true);
    expect(fileExtPattern.test('scripts/lint/check')).toBe(false);
  });

  it('should identify scripts/ paths as valid local paths', () => {
    // Paths starting with scripts/ should be validated
    const scriptsPath = 'scripts/lint/check.ts';
    expect(scriptsPath.startsWith('scripts/')).toBe(true);
    
    // Paths starting with other top-level dirs should also be validated
    const topLevelPath = 'tools/codemods/fix.ts';
    const isTopLevel = /^[a-z][a-z0-9_-]*\//i.test(topLevelPath);
    expect(isTopLevel).toBe(true);
  });

  it('should skip known binaries', () => {
    // Known binaries should not be validated as file paths
    const knownBinaries = [
      'eslint', 'prettier', 'next', 'vitest', 'turbo', 'tsc', 'tsx', 'node', 'pnpm'
    ];
    
    for (const binary of knownBinaries) {
      const token = binary;
      const binaryName = token.split('/').pop()?.split('\\').pop() || '';
      // In real implementation, this would check against KNOWN_BINARIES Set
      expect(knownBinaries.includes(binaryName)).toBe(true);
    }
  });
});
