import { execFileSync } from 'node:child_process';

/**
 * Check if a path is gitignored
 * 
 * Fix: Use execFileSync with argument array + -- separator to prevent pathspec interpretation.
 * This prevents Windows from escaping brackets in Next.js dynamic route paths like [entity].
 * 
 * @param path - File path to check (may contain brackets, e.g., app/api/v1/entity/[entity]/route.ts)
 * @returns true if path is gitignored, false otherwise
 */
export function isGitIgnored(path: string): boolean {
  try {
    execFileSync('git', ['check-ignore', '--', path], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * List tracked files matching a pattern
 * 
 * Fix: Use execFileSync with argument array + -- separator to prevent pathspec glob interpretation.
 * The -- separator ensures git treats the pattern as a literal pathspec, not a glob pattern.
 * 
 * @param pattern - Git pathspec pattern (may contain brackets, e.g., app/api/v1/entity/[entity]/route.ts)
 * @returns Array of tracked file paths matching the pattern
 */
export function listTrackedFiles(pattern: string): string[] {
  try {
    const output = execFileSync('git', ['ls-files', '--', pattern], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      maxBuffer: 10 * 1024 * 1024,
    });
    return output.trim().split('\n').filter(Boolean);
  } catch {
    return [];
  }
}

/**
 * Get git status for a file (porcelain format)
 * 
 * Fix: Use execFileSync with argument array + -- separator to prevent pathspec interpretation.
 * This ensures paths with brackets (e.g., [entity]) are treated as literal paths.
 * 
 * @param file - File path to check status (may contain brackets)
 * @returns Git porcelain status string, or empty string if file not found
 */
export function getGitStatus(file: string): string {
  try {
    return execFileSync('git', ['status', '--porcelain', '--', file], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

