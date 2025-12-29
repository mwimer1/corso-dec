import { execSync } from 'node:child_process';

/**
 * Check if a path is gitignored
 */
export function isGitIgnored(path: string): boolean {
  try {
    execSync(`git check-ignore "${path}"`, {
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
 */
export function listTrackedFiles(pattern: string): string[] {
  try {
    const output = execSync(`git ls-files "${pattern}"`, {
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
 */
export function getGitStatus(file: string): string {
  try {
    return execSync(`git status --porcelain "${file}"`, {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
  } catch {
    return '';
  }
}

