// scripts/lib/lastUpdated.ts

import { EOL } from 'os';

const today = new Date().toISOString().slice(0, 10);

const YAML_FRONT_MATTER_REGEX = /^---\n([\s\S]*?)\n---/;
const LAST_UPDATED_YAML_REGEX = /^(last_updated:)\s*(\S*)/m;
const LAST_UPDATED_FOOTER_REGEX = /^(_Last updated:_)[\s_]*(\S*)_?/m;
const ROGUE_HEADER_REGEX = /---\nLast updated:.*\n---\n/;

/**
 * Strips the rogue "Last updated" header if it exists
 * 
 * This function removes malformed YAML front matter headers that contain
 * "Last updated" information, which can interfere with proper timestamp management.
 * 
 * @param content - The file content to process
 * @returns Content with the rogue header removed
 * 
 * @example
 * ```typescript
 * const content = `---\nLast updated: 2024-01-01\n---\n\nContent here`;
 * const cleaned = stripRogueHeader(content);
 * // Returns: "\n\nContent here"
 * ```
 */
export function stripRogueHeader(content: string): string {
  return content.replace(ROGUE_HEADER_REGEX, '');
}

/**
 * Removes any existing "Last updated" footer.
 * @param content The file content.
 * @returns Content with the footer removed.
 */
function removeFooter(content: string): string {
  // Regex to match multiple footer variants, potentially with surrounding newlines
  const allFooterRegex = new RegExp(`(^|\\n)s*_Last updated:_[\\s_]*\\S*_?s*(${EOL}|$)`, 'gm');
  return content.replace(allFooterRegex, '');
}

/**
 * Updates the timestamp in the file content
 * 
 * This function intelligently updates timestamps in documentation files.
 * It handles both YAML front matter and footer timestamps, ensuring only
 * one timestamp format is present in the final content.
 * 
 * Priority order:
 * 1. Update existing YAML front matter timestamp
 * 2. Update existing footer timestamp
 * 3. Add new footer timestamp if none exists
 * 
 * @param originalContent - The original file content
 * @param newDate - The new date string in YYYY-MM-DD format
 * @returns The updated file content with the new timestamp
 * 
 * @example
 * ```typescript
 * // Update YAML front matter
 * const content = `---\nlast_updated: 2024-01-01\n---\n\nContent`;
 * const updated = updateTimestamp(content, '2025-01-16');
 * // Result: "---\nlast_updated: 2025-01-16\n---\n\nContent"
 * 
 * // Update footer timestamp
 * const content = `Content\n\n_Last updated: 2024-01-01_`;
 * const updated = updateTimestamp(content, '2025-01-16');
 * // Result: "Content\n\n_Last updated: 2025-01-16_"
 * 
 * // Add new timestamp
 * const content = 'Content without timestamp';
 * const updated = updateTimestamp(content, '2025-01-16');
 * // Result: "Content without timestamp\n\n_Last updated: 2025-01-16_"
 * ```
 */
export function updateTimestamp(originalContent: string, newDate: string): string {
  let content = stripRogueHeader(originalContent);

  const frontMatterMatch = content.match(YAML_FRONT_MATTER_REGEX);

  if (frontMatterMatch) {
    const frontMatter = frontMatterMatch[1];
    if (frontMatter && LAST_UPDATED_YAML_REGEX.test(frontMatter)) {
      // Case 1: YAML front-matter with last_updated exists.
      // Update it and ensure no footer exists.
      const contentWithUpdatedYaml = content.replace(LAST_UPDATED_YAML_REGEX, `$1 ${newDate}`);
      return removeFooter(contentWithUpdatedYaml);
    }
  }

  // Case 2: No YAML, look for a footer to update.
  if (LAST_UPDATED_FOOTER_REGEX.test(content)) {
    return content.replace(LAST_UPDATED_FOOTER_REGEX, `$1 ${newDate}_`);
  }

  // Case 3: Neither exists, add a new footer.
  const newFooter = `${EOL}${EOL}_Last updated: ${newDate}_`;
  return content.trimEnd() + newFooter;
}

/**
 * Checks if a file needs its timestamp updated
 * 
 * This function determines whether a documentation file needs its timestamp
 * updated by checking if the current timestamp is different from today's date.
 * It handles both YAML front matter and footer timestamp formats.
 * 
 * @param content - The file content to check
 * @returns True if the timestamp needs updating (old or missing), false otherwise
 * 
 * @example
 * ```typescript
 * // Check YAML front matter timestamp
 * const content = `---\nlast_updated: 2024-01-01\n---\n\nContent`;
 * const needsUpdating = needsUpdate(content); // true (if today is not 2024-01-01)
 * 
 * // Check footer timestamp
 * const content = `Content\n\n_Last updated: 2024-01-01_`;
 * const needsUpdating = needsUpdate(content); // true (if today is not 2024-01-01)
 * 
 * // No timestamp found
 * const content = 'Content without timestamp';
 * const needsUpdating = needsUpdate(content); // true
 * ```
 */
export function needsUpdate(content: string): boolean {
  const frontMatterMatch = content.match(YAML_FRONT_MATTER_REGEX);
  if (frontMatterMatch) {
    const frontMatter = frontMatterMatch[1];
    if (frontMatter && LAST_UPDATED_YAML_REGEX.test(frontMatter)) {
      const yamlMatch = frontMatter.match(LAST_UPDATED_YAML_REGEX);
      if (yamlMatch && yamlMatch[2]) {
        const dateStr = yamlMatch[2];
        return isDateOld(dateStr);
      }
    }
  }

  const footerMatch = content.match(LAST_UPDATED_FOOTER_REGEX);
  if (footerMatch && footerMatch[2]) {
    const dateStr = footerMatch[2].replace(/_/g, '');
    return isDateOld(dateStr);
  }

  return true; // No timestamp found, so it needs an update.
}

function isDateOld(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return true; // Invalid date format
  }
  // No cutoff logic from original script, just check if it's today.
  // The goal is idempotency, so we update if it's not today's date.
  return date.toISOString().slice(0, 10) !== today;
} 

