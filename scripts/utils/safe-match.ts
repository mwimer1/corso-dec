/**
 * Safely extracts the first capture group from a regex match
 * 
 * This utility function provides a safe way to extract capture groups from regex matches.
 * It throws a descriptive error if the pattern is not found or if there's no capture group.
 * 
 * @param re - Regular expression with at least one capture group
 * @param str - String to match against
 * @returns The first capture group from the match
 * @throws {Error} When the pattern is not found or has no capture groups
 * 
 * @example
 * ```typescript
 * // Extract version number
 * const version = safeMatch(/version-(\d+\.\d+\.\d+)/, 'version-1.2.3');
 * // Returns: "1.2.3"
 * 
 * // Extract filename from path
 * const filename = safeMatch(/\/?([^\/]+)$/, '/path/to/file.txt');
 * // Returns: "file.txt"
 * 
 * // This will throw an error
 * safeMatch(/no-capture/, 'test'); // Error: Pattern /no-capture/ not found in "test"
 * ```
 */
export function safeMatch(re: RegExp, str: string): string {
  const m = str.match(re);
  if (!m?.[1]) {
    throw new Error(`Pattern ${re} not found in "${str}"`);
  }
  return m[1];
} 

