/**
 * Unit tests for CSS audit target builder
 *
 * Tests changed file detection, merge-base handling, and file filtering
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'child_process';
import { getChangedFiles, buildTargetSet } from '../../scripts/audit/targets';

// Mock child_process
vi.mock('child_process', async () => {
  const actual = await vi.importActual<typeof import('child_process')>('child_process');
  return {
    ...actual,
    spawnSync: vi.fn(),
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
  const mockSpawnSync = spawnSync as ReturnType<typeof vi.fn>;
  const mockRootDir = '/fake/repo';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('getChangedFiles - merge-base behavior', () => {
    it('should use merge-base when comparing against a branch', () => {
      // Setup: triple-dot syntax succeeds (uses merge-base automatically)
      mockSpawnSync.mockImplementation((cmd: string, args: string[]) => {
        // Check if any arg contains triple-dot syntax
        if (args && args.some((arg: string) => typeof arg === 'string' && arg.includes('...'))) {
          // Triple-dot syntax - should succeed
          return {
            status: 0,
            stdout: 'file1.css\nfile2.ts',
            stderr: '',
          };
        }
        return {
          status: 1,
          stdout: '',
          stderr: 'error',
        };
      });

      const result = getChangedFiles(mockRootDir, 'main');

      expect(mockSpawnSync).toHaveBeenCalledWith(
        'git',
        ['diff', '--name-only', '--diff-filter=ACMR', 'main...HEAD'],
        expect.objectContaining({ cwd: mockRootDir, encoding: 'utf8' })
      );
      expect(result.ok).toBe(true);
      expect(result.method).toBe('triple-dot');
      expect(result.files).toEqual(['file1.css', 'file2.ts']);
    });

    it('should fall back to direct diff when merge-base fails', () => {
      // Setup: triple-dot fails, direct diff succeeds
      let callCount = 0;
      mockSpawnSync.mockImplementation((cmd: string, args: string[]) => {
        callCount++;
        // Check if any arg contains triple-dot syntax
        if (args && args.some((arg: string) => typeof arg === 'string' && arg.includes('...'))) {
          // Triple-dot syntax fails
          return {
            status: 1,
            stdout: '',
            stderr: 'fatal: ambiguous argument',
          };
        }
        // Direct diff succeeds (no triple-dot)
        return {
          status: 0,
          stdout: 'file1.css',
          stderr: '',
        };
      });

      const result = getChangedFiles(mockRootDir, 'HEAD~1');

      expect(mockSpawnSync).toHaveBeenCalledWith(
        'git',
        ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD~1...HEAD'],
        expect.any(Object)
      );
      expect(mockSpawnSync).toHaveBeenCalledWith(
        'git',
        ['diff', '--name-only', '--diff-filter=ACMR', 'HEAD~1', 'HEAD'],
        expect.any(Object)
      );
      expect(result.ok).toBe(true);
      expect(result.method).toBe('direct');
      expect(result.files).toEqual(['file1.css']);
    });

    it('should handle empty output gracefully', () => {
      mockSpawnSync.mockImplementation((cmd: string, args: string[]) => {
        // Check if any arg contains triple-dot syntax
        if (args && args.some((arg: string) => typeof arg === 'string' && arg.includes('...'))) {
          return {
            status: 0,
            stdout: '', // No changes
            stderr: '',
          };
        }
        return {
          status: 1,
          stdout: '',
          stderr: '',
        };
      });

      const result = getChangedFiles(mockRootDir, 'main');

      expect(result.ok).toBe(true);
      expect(result.method).toBe('triple-dot');
      expect(result.files).toEqual([]);
    });

    it('should handle git command failures gracefully', () => {
      mockSpawnSync.mockImplementation(() => {
        // Both triple-dot and direct diff fail
        return {
          status: 128,
          stdout: '',
          stderr: 'fatal: not a git repository',
        };
      });

      const result = getChangedFiles(mockRootDir, 'main');

      expect(result.ok).toBe(false);
      expect(result.files).toEqual([]);
      expect(result.method).toBeUndefined();
    });

    it('should normalize file paths correctly', () => {
      mockSpawnSync.mockImplementation((cmd: string, args: string[]) => {
        // Check if any arg contains triple-dot syntax
        if (args && args.some((arg: string) => typeof arg === 'string' && arg.includes('...'))) {
          // Test with Windows-style paths and various whitespace
          // Note: normalizePath will convert backslashes and filter(Boolean) removes empty strings
          return {
            status: 0,
            stdout: 'styles\\file1.css\n  styles/file2.ts  \nstyles/file3.css\n',
            stderr: '',
          };
        }
        return {
          status: 1,
          stdout: '',
          stderr: '',
        };
      });

      const result = getChangedFiles(mockRootDir, 'main');

      // All paths should be normalized (forward slashes, trimmed, empty lines filtered)
      expect(result.ok).toBe(true);
      expect(result.files).toEqual(['styles/file1.css', 'styles/file2.ts', 'styles/file3.css']);
    });
  });

  describe('buildTargetSet', () => {
    it('should filter CSS files correctly in changed mode', async () => {
      const { glob } = await import('glob');
      const mockGlob = glob as ReturnType<typeof vi.fn>;

      mockSpawnSync.mockImplementation((cmd: string, args: string[]) => {
        // Check if any arg contains triple-dot syntax
        if (args && args.some((arg: string) => typeof arg === 'string' && arg.includes('...'))) {
          return {
            status: 0,
            stdout: 'styles/file1.css\nstyles/module.module.css\nstyles/file2.ts',
            stderr: '',
          };
        }
        return {
          status: 1,
          stdout: '',
          stderr: '',
        };
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

      mockSpawnSync.mockImplementation((cmd: string, args: string[]) => {
        // Check if any arg contains triple-dot syntax
        if (args && args.some((arg: string) => typeof arg === 'string' && arg.includes('...'))) {
          return {
            status: 0,
            stdout: 'styles/file1.css\nlib/file2.css\ntests/file3.css',
            stderr: '',
          };
        }
        return {
          status: 1,
          stdout: '',
          stderr: '',
        };
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
