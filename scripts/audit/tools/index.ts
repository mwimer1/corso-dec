#!/usr/bin/env tsx
/**
 * CSS Audit Tools Registry
 *
 * Exports all CSS audit tools for use by the orchestrator.
 */

export { stylelintTool } from './stylelint';
export { duplicateStylesTool } from './duplicate-styles';
export { cssPathsTool } from './css-paths';
export { unusedTokensTool } from './unused-tokens';
export { cssSizeTool } from './css-size';
export { validateStylesTool } from './validate-styles';
export { cssUnusedClassesTool } from './css-unused-classes';
export { cssOverlappingRulesTool } from './css-overlapping-rules';
export { cssBestPracticesTool } from './css-best-practices';
export { purgeStylesTool } from './purge-styles';

import type { CssAuditTool } from '../types';
import { stylelintTool } from './stylelint';
import { duplicateStylesTool } from './duplicate-styles';
import { cssPathsTool } from './css-paths';
import { unusedTokensTool } from './unused-tokens';
import { cssSizeTool } from './css-size';
import { validateStylesTool } from './validate-styles';
import { cssUnusedClassesTool } from './css-unused-classes';
import { cssOverlappingRulesTool } from './css-overlapping-rules';
import { cssBestPracticesTool } from './css-best-practices';
import { purgeStylesTool } from './purge-styles';

/**
 * All available CSS audit tools (audit category only - fix tools excluded)
 */
export const allTools: CssAuditTool[] = [
  stylelintTool,
  duplicateStylesTool,
  cssPathsTool,
  unusedTokensTool,
  cssSizeTool,
  validateStylesTool,
  cssUnusedClassesTool,
  cssOverlappingRulesTool,
  cssBestPracticesTool,
  // Note: purgeStylesTool is excluded from default - it's a fix tool
  // Add it via --tools css-purge-styles or --force
];
