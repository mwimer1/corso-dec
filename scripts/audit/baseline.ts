#!/usr/bin/env tsx
/**
 * Baseline Management
 *
 * Handles reading, writing, and updating baselines for findings.
 * Baselines allow suppressing known issues while still tracking new ones.
 */

import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import type { Finding, CssAuditTool, ToolContext } from './types';

export interface Baseline {
  version: string;
  generatedAt: string;
  entries: BaselineEntry[];
}

export interface BaselineEntry {
  fingerprint: string;
  tool: string;
  ruleId: string;
  severity: string;
  note?: string;
  addedAt?: string;
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
      generatedAt: new Date().toISOString(),
      entries: [],
    };
  }

  try {
    const content = readFileSync(path, 'utf8');
    const parsed = JSON.parse(content) as unknown;
    
    // Migrate old format if needed
    if (parsed && typeof parsed === 'object' && 'findings' in parsed && !('entries' in parsed)) {
      const oldBaseline = parsed as { findings: Record<string, any>; version?: string; timestamp?: string; generatedAt?: string };
      const entries: BaselineEntry[] = [];
      for (const [key, entry] of Object.entries(oldBaseline.findings || {})) {
        entries.push({
          fingerprint: entry?.fingerprint || key.split(':').pop() || '',
          tool: entry?.tool || '',
          ruleId: entry?.ruleId || '',
          severity: entry?.severity || 'warn',
          addedAt: entry?.lastSeen || entry?.addedAt,
        });
      }
      const version = oldBaseline.version || '1.0';
      const generatedAt = oldBaseline.timestamp || oldBaseline.generatedAt || new Date().toISOString();
      
      return {
        version,
        generatedAt,
        entries: entries.sort(compareBaselineEntry),
      };
    }
    
    // Validate it's a proper Baseline
    if (parsed && typeof parsed === 'object' && 'version' in parsed && 'generatedAt' in parsed && 'entries' in parsed) {
      return parsed as Baseline;
    }
  } catch {
    // If baseline is invalid, fall through to return empty baseline
  }
  
  // Invalid format or error - return empty baseline
  return {
    version: '1.0',
    generatedAt: new Date().toISOString(),
    entries: [],
  };
}

/**
 * Compare baseline entries for deterministic ordering
 */
function compareBaselineEntry(a: BaselineEntry, b: BaselineEntry): number {
  if (a.tool !== b.tool) {
    return a.tool.localeCompare(b.tool);
  }
  if (a.ruleId !== b.ruleId) {
    return a.ruleId.localeCompare(b.ruleId);
  }
  return a.fingerprint.localeCompare(b.fingerprint);
}

/**
 * Write baseline to file with deterministic ordering
 */
export function writeBaseline(path: string, baseline: Baseline): void {
  // Ensure deterministic ordering
  const sorted = {
    ...baseline,
    entries: [...baseline.entries].sort(compareBaselineEntry),
  };
  
  writeFileSync(path, JSON.stringify(sorted, null, 2) + '\n', 'utf8');
}

/**
 * Filter findings against baseline
 */
export function filterAgainstBaseline(
  findings: Finding[],
  baseline: Baseline
): { suppressed: Finding[]; new: Finding[] } {
  const baselineSet = new Set(baseline.entries.map(e => e.fingerprint));
  const suppressed: Finding[] = [];
  const newFindings: Finding[] = [];

  for (const finding of findings) {
    if (baselineSet.has(finding.fingerprint)) {
      suppressed.push(finding);
    } else {
      newFindings.push(finding);
    }
  }

  return { suppressed, new: newFindings };
}

/**
 * Update baseline with new findings from tools
 */
export function updateBaseline(
  baseline: Baseline,
  findings: Finding[],
  tools: CssAuditTool[],
  ctx: ToolContext
): Baseline {
  const toolMap = new Map(tools.map(t => [t.id, t]));
  const existingFingerprints = new Set(baseline.entries.map(e => e.fingerprint));
  const entries: BaselineEntry[] = [...baseline.entries];
  const now = new Date().toISOString();

  for (const finding of findings) {
    // Skip if already in baseline
    if (existingFingerprints.has(finding.fingerprint)) {
      continue;
    }

    // Check if tool wants this finding in baseline
    const tool = toolMap.get(finding.tool);
    const shouldInclude = tool?.baselineInclude
      ? tool.baselineInclude(finding, ctx)
      : defaultBaselineInclude(finding, ctx);

    if (shouldInclude) {
      entries.push({
        fingerprint: finding.fingerprint,
        tool: finding.tool,
        ruleId: finding.ruleId,
        severity: finding.severity,
        addedAt: now,
      });
    }
  }

  return {
    version: baseline.version,
    generatedAt: now,
    entries,
  };
}

/**
 * Prune baseline entries for files that no longer exist
 */
export function pruneBaseline(baseline: Baseline, existingFiles: Set<string>): Baseline {
  // For now, we don't prune by file since fingerprints don't include file paths
  // This can be enhanced if needed
  return baseline;
}
