#!/usr/bin/env tsx
/**
 * CSS Audit Tools Registry
 *
 * Exports all CSS audit tools for use by the orchestrator.
 */

export { unusedClassesTool } from './unused-classes';
export { overlappingRulesTool } from './overlapping-rules';
export { bestPracticesTool } from './best-practices';

import type { CssAuditTool } from '../types';
import { unusedClassesTool } from './unused-classes';
import { overlappingRulesTool } from './overlapping-rules';
import { bestPracticesTool } from './best-practices';

/**
 * All available CSS audit tools
 */
export const allTools: CssAuditTool[] = [
  unusedClassesTool,
  overlappingRulesTool,
  bestPracticesTool,
];
