/**
 * @fileoverview Zod schema for styles-keep-allowlist.json validation
 * @description Validates the structure and content of styles keep allowlist configuration
 */

import { readFileSync } from 'fs';
import { z } from 'zod';

/**
 * Schema for styles-keep-allowlist.json
 *
 * The allowlist specifies which style exports should be preserved even if they appear unused.
 * This is useful for:
 * - Exports used in CSS-in-JS or dynamic styling
 * - Exports referenced in documentation or examples
 * - Exports that are conditionally used (e.g., based on feature flags)
 * - Future-proofing exports that may be used in upcoming features
 */
export const stylesKeepAllowlistSchema = z.object({
  /** Global exports that should always be kept across all style domains */
  global: z.array(z.string()).default([]),

  /** Atom-level style exports to preserve */
  atoms: z.array(z.string()).default([]),

  /** Molecule-level style exports to preserve */
  molecules: z.array(z.string()).default([]),

  /** Organism-level style exports to preserve */
  organisms: z.array(z.string()).default([]),
}).strict();

/**
 * Type definition for the styles keep allowlist
 */
export type StylesKeepAllowlist = z.infer<typeof stylesKeepAllowlistSchema>;

/**
 * Validates a styles keep allowlist configuration
 *
 * @param data - The configuration object to validate
 * @returns The validated configuration
 * @throws ZodError if validation fails
 */
export function validateStylesKeepAllowlist(data: unknown): StylesKeepAllowlist {
  return stylesKeepAllowlistSchema.parse(data);
}

/**
 * Validates an allowlist file and returns detailed error information
 *
 * @param allowlistPath - Path to the allowlist JSON file
 * @returns Validation result with success status and error details
 */
export function validateAllowlistFile(allowlistPath: string): {
  success: boolean;
  data?: StylesKeepAllowlist;
  errors: string[];
} {
  try {
    const allowlistContent = JSON.parse(readFileSync(allowlistPath, 'utf8'));
    const data = validateStylesKeepAllowlist(allowlistContent);

    return {
      success: true,
      data,
      errors: [],
    };
  } catch (error) {
    const errors = [];
    if (error instanceof Error) {
      errors.push(error.message);
    } else {
      errors.push('Unknown validation error');
    }

    return {
      success: false,
      errors,
    };
  }
}

