/**
 * Unit tests for CSS audit target builder
 *
 * Tests changed file detection, merge-base handling, and file filtering
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { execFileSync } from 'child_process';
import { getChangedFiles, buildTargetSet } from '../../scripts/audit/targets';

// Mock child_process
vi.mock('child_process', () => {
  return {
    execFileSync: vi.fn(),
  };
});

// Mock glob
vi.mock('glob', async () => {
  const actual = await vi.importActual('glob');
  return {
    ...actual,
    glob: vi.fn(),
  };
});

describe('CSS Audit Targets', () => {
  const mockExecFileSync = execFileSync as ReturnType<typeof vi.fn>;
  const mockRootDir = '/fake/repo';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getChangedFiles - merge-base behavior', () => {
    it('should use merge-base when comparing against a branch', () => {
      // Setup: merge-base returns a commit hash
      mockExecFileSync.mockImplementation((cmd: string, args: string[]) => {
        if (args[0] === 'merge-base') {
          return 'abc123'; // Merge-base commit
        }
        if (args[0] === 'diff') {
          // Should be called with merge-base commit, not the branch name
          expect(args[args.length - 2]).toBe('abc123');
          expect(args[args.length - 1]).toBe('HEAD');
          return 'file1.css\nfile2.ts';
        }
        return '';
      });

      const result = getChangedFiles(mockRootDir, 'main');

      expect(mockExecFileSync).toHaveBeenCalledWith('git', ['merge-base', 'main', 'HEAD'], expect.any(Object));
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        ['diff', '--name-only', '--diff-filter=ACMR', 'abc123', 'HEAD'],
        expect.any(Object)
      );
      expect(result).toEqual(['file1.css', 'file2.ts']);
    });

    it('should fall back to direct diff when merge-base fails', () => {
      // Setup: merge-base fails (e.g., not a branch, invalid ref)
      mockExecFileSync.mockImplementation((cmd: string, args: string[]) => {
        if (args[0] === 'merge-base') {
          throw new Error('Not a valid object');
        }
        if (args[0] === 'diff') {
          // Should fall back to using the since ref directly
          expect(args[args.length - 2]).toBe('HEAD~1');
          expect(args[args.length - 1]).toBe('HEAD');
          return 'file1.css';
        }
        return '';
      });

      const result = getChangedFiles(mockRootDir, 'HEAD~1');

      expect(mockExecFileSync).toHaveBeenCalledWith('git', ['merge-base', 'HEAD~1', 'HEAD'], expect.any(Object));
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD~1', 'HEAD'],
        expect.any(Object)
      );
      expect(result).toEqual(['file1.css']);
    });

    it('should handle empty output gracefully', () => {
      mockExecFileSync.mockImplementation((cmd: string, args: string[]) => {
        if (args[0] === 'merge-base') {
          return 'abc123';
        }
        if (args[0] === 'diff') {
          return ''; // No changes
        }
        return '';
      });

      const result = getChangedFiles(mockRootDir, 'main');

      expect(result).toEqual([]);
    });

    it('should handle git command failures gracefully', () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('Not a git repository');
      });

      const result = getChangedFiles(mockRootDir, 'main');

      expect(result).toEqual([]);
    });

    it('should normalize file paths correctly', () => {
      mockExecFileSync.mockImplementation((cmd: string, args: string[]) => {
        if (args[0] === 'merge-base') {
          return 'abc123';
        }
        if (args[0] === 'diff') {
          // Test with Windows-style paths and various whitespace
          // Note: normalizePath will convert backslashes and filter(Boolean) removes empty strings
          return 'styles\\file1.css\n  styles/file2.ts  \nstyles/file3.css\n';
        }
        return '';
      });

      const result = getChangedFiles(mockRootDir, 'main');

      // All paths should be normalized (forward slashes, trimmed, empty lines filtered)
      expect(result).toEqual(['styles/file1.css', 'styles/file2.ts', 'styles/file3.css']);
    });
  });

  describe('buildTargetSet', () => {
    it('should filter CSS files correctly in changed mode', async () => {
      const { glob } = await import('glob');
      const mockGlob = glob as ReturnType<typeof vi.fn>;

      mockExecFileSync.mockImplementation((cmd: string, args: string[]) => {
        if (args[0] === 'merge-base') {
          return 'abc123';
        }
        if (args[0] === 'diff') {
          return 'styles/file1.css\nstyles/module.module.css\nstyles/file2.ts';
        }
        return '';
      });

      // Mock glob for CSS modules (called in changed mode to get all modules for index)
      mockGlob.mockImplementation((pattern: string) => {
        if (pattern === '**/*.module.css') {
          return Promise.resolve(['styles/module.module.css']);
        }
        return Promise.resolve([]);
      });

      const result = await buildTargetSet({
        rootDir: mockRootDir,
        changed: true,
        since: 'main',
      });

      expect(result.mode).toBe('changed');
      expect(result.cssFiles).toContain('styles/file1.css');
      // cssModuleFiles includes all modules (for index building), not just changed ones
      expect(result.cssModuleFiles).toContain('styles/module.module.css');
      expect(result.tsFiles).toContain('styles/file2.ts');
      expect(result.allFiles).toContain('styles/file1.css');
      expect(result.allFiles).toContain('styles/file2.ts');
    });

    it('should handle include/exclude patterns', async () => {
      const { glob } = await import('glob');
      const mockGlob = glob as ReturnType<typeof vi.fn>;

      mockExecFileSync.mockImplementation((cmd: string, args: string[]) => {
        if (args[0] === 'merge-base') {
          return 'abc123';
        }
        if (args[0] === 'diff') {
          return 'styles/file1.css\nlib/file2.css\ntests/file3.css';
        }
        return '';
      });

      mockGlob.mockResolvedValue([]);

      // Verify the function completes without error with include/exclude patterns
      const result = await buildTargetSet({
        rootDir: mockRootDir,
        changed: true,
        since: 'main',
        include: ['styles/**'],
        exclude: ['**/*.test.*'],
      });

      // Basic structure verification
      expect(result.mode).toBe('changed');
      expect(result.sinceRef).toBe('main');
      // Note: Pattern filtering logic is tested in integration tests
      // This test verifies the function executes with include/exclude options
    });
  });
});
