#!/usr/bin/env tsx
/**
 * Centralized scan root directory definitions
 * 
 * This file defines canonical directory lists used across maintenance scripts
 * to avoid hardcoding directory sequences in package.json scripts.
 * 
 * Usage:
 *   import { SCAN_ROOTS } from './scan-roots';
 *   const dirs = SCAN_ROOTS.core.join(' ');
 */

/**
 * Canonical scan root presets
 */
export const SCAN_ROOTS = {
  /**
   * Core source directories (app, components, lib)
   */
  core: ['app', 'components', 'lib'] as const,

  /**
   * Full source directories (app, components, lib, types, styles)
   */
  full: ['app', 'components', 'lib', 'types', 'styles'] as const,
} as const;
