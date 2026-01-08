#!/usr/bin/env tsx
/**
 * Baseline Management
 *
 * Handles reading, writing, and updating baselines for findings.
 * Baselines allow suppressing known issues while still tracking new ones.
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Finding, CssAuditTool, ToolContext, ResolvedCliOptions } from './types';

export interface Baseline {
  version: string;
  timestamp: string;
  findings: Record<string, BaselineEntry>;
}

export interface BaselineEntry {
  tool: string;
  ruleId: string;
  file?: string;
  fingerprint: string;
  severity: string;
  message: string;
  lastSeen: string;
}

/**
 * Default baseline include filter: include findings with severity !== 'info'
 */
export function defaultBaselineInclude(finding: Finding, _ctx: ToolContext): boolean {
  return finding.severity !== 'info';
}

/**
 * Read baseline from file
 */
export function readBaseline(path: string): Baseline {
  if (!existsSync(path)) {
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      findings: {},
    };
  }

  try {
    const content = readFileSync(path, 'utf8');
    return JSON.parse(content) as Baseline;
  } catch {
    // If baseline is invalid, return empty baseline
    return {
      version: '1.0',
      timestamp: new Date().toISOString(),
      findings: {},
    };
  }
}

/**
 * Write baseline to file
 */
export function writeBaseline(path: string, baseline: Baseline): void {
  const dir = dirname(path);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  writeFileSync(path, JSON.stringify(baseline, null, 2), 'utf8');
}

/**
 * Filter findings against baseline
 */
export function filterAgainstBaseline(
  findings: Finding[],
  baseline: Baseline
): { suppressed: Finding[]; new: Finding[] } {
  const suppressed: Finding[] = [];
  const newFindings: Finding[] = [];

  for (const finding of findings) {
    const key = `${finding.tool}:${finding.ruleId}:${finding.fingerprint}`;
    const baselineEntry = baseline.findings[key];

    if (baselineEntry) {
      suppressed.push(finding);
    } else {
      newFindings.push(finding);
    }
  }

  return { suppressed, new: newFindings };
}

/**
 * Update baseline with new findings
 */
export function updateBaseline(
  baseline: Baseline,
  findings: Finding[],
  tools: CssAuditTool[],
  ctx: ToolContext
): Baseline {
  const toolMap = new Map(tools.map(t => [t.id, t]));
  const updated = { ...baseline };
  updated.timestamp = new Date().toISOString();

  for (const finding of findings) {
    const tool = toolMap.get(finding.tool);
    const shouldInclude = tool?.baselineInclude
      ? tool.baselineInclude(finding, ctx)
      : defaultBaselineInclude(finding, ctx);

    if (shouldInclude) {
      const key = `${finding.tool}:${finding.ruleId}:${finding.fingerprint}`;
      updated.findings[key] = {
        tool: finding.tool,
        ruleId: finding.ruleId,
        ...(finding.file ? { file: finding.file } : {}),
        fingerprint: finding.fingerprint,
        severity: finding.severity,
        message: finding.message,
        lastSeen: new Date().toISOString(),
      };
    }
  }

  return updated;
}

/**
 * Prune baseline entries for files that no longer exist
 */
export function pruneBaseline(baseline: Baseline, existingFiles: Set<string>): Baseline {
  const pruned: Baseline = {
    ...baseline,
    findings: {},
  };

  for (const [key, entry] of Object.entries(baseline.findings)) {
    if (!entry.file || existingFiles.has(entry.file)) {
      pruned.findings[key] = entry;
    }
  }

  return pruned;
}
