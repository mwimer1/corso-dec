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
 * 
 * Prunes entries for tools that ran (replacing them with current findings),
 * but preserves entries for tools that did not run.
 * 
 * This ensures the baseline reflects the current state of tools that executed,
 * while maintaining entries for tools that weren't executed in this run.
 */
export function updateBaseline(
  baseline: Baseline,
  findings: Finding[],
  tools: CssAuditTool[],
  ctx: ToolContext
): Baseline {
  const toolMap = new Map(tools.map(t => [t.id, t]));
  const toolIds = new Set(tools.map(t => t.id));
  const now = new Date().toISOString();

  // Build a map of findings by fingerprint for quick lookup
  const findingsByFingerprint = new Map<string, Finding>();
  for (const finding of findings) {
    findingsByFingerprint.set(finding.fingerprint, finding);
  }

  // Start with entries from tools that didn't run (preserve them)
  const preservedEntries: BaselineEntry[] = baseline.entries.filter(entry => {
    // Keep entries for tools that didn't run in this execution
    return !toolIds.has(entry.tool);
  });

  // Build entries map for deduplication
  const entryMap = new Map<string, BaselineEntry>();

  // First, add preserved entries (for tools that didn't run)
  for (const entry of preservedEntries) {
    entryMap.set(entry.fingerprint, entry);
  }

  // Build a map of existing entries by fingerprint for preserving addedAt
  const existingEntriesByFingerprint = new Map<string, BaselineEntry>();
  for (const entry of baseline.entries) {
    if (toolIds.has(entry.tool)) {
      // Only track entries for tools that ran (to preserve their addedAt)
      existingEntriesByFingerprint.set(entry.fingerprint, entry);
    }
  }

  // Then, process findings from tools that ran:
  // - Add new findings that should be included
  // - Update existing entries for tools that ran (preserving addedAt when unchanged)
  for (const finding of findings) {
    const tool = toolMap.get(finding.tool);
    const shouldInclude = tool?.baselineInclude
      ? tool.baselineInclude(finding, ctx)
      : defaultBaselineInclude(finding, ctx);

    if (shouldInclude) {
      // Preserve addedAt if entry already exists (reduces baseline churn)
      const existingEntry = existingEntriesByFingerprint.get(finding.fingerprint);
      const addedAt = existingEntry?.addedAt ?? now;
      
      // Add or update entry for this finding
      entryMap.set(finding.fingerprint, {
        fingerprint: finding.fingerprint,
        tool: finding.tool,
        ruleId: finding.ruleId,
        severity: finding.severity,
        addedAt,
      });
    } else {
      // Remove from baseline if tool says it shouldn't be included
      entryMap.delete(finding.fingerprint);
    }
  }

  // Prune entries for tools that ran but are no longer present in findings
  // This handles the case where a finding was fixed and no longer appears
  // We need to explicitly remove old entries that are not in the current findings
  for (const entry of baseline.entries) {
    if (toolIds.has(entry.tool)) {
      // This tool ran - if entry isn't in current findings, it means the issue was resolved
      if (!findingsByFingerprint.has(entry.fingerprint)) {
        // Entry was removed (issue fixed) - remove from entryMap if present
        entryMap.delete(entry.fingerprint);
      }
    }
  }

  return {
    version: baseline.version,
    generatedAt: now,
    entries: Array.from(entryMap.values()),
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
