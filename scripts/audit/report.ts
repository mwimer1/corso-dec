#!/usr/bin/env tsx
/**
 * Report Generator
 *
 * Formats and outputs audit results in JSON format.
 * Console summary is handled in the orchestrator.
 */

import { writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';
import type { Finding, Severity, Artifact, TargetSet } from './types';

export interface AuditReport {
  generatedAt: string;
  metadata: {
    mode: 'full' | 'changed';
    sinceRef?: string;
    changedFilesCount: number;
    toolsRun: string[];
  };
  summary: {
    totalFindings: number;
    suppressed: number;
    new: number;
    bySeverity: {
      error: number;
      warn: number;
      info: number;
    };
    byTool: Record<string, number>;
    topRuleIds: Array<{ ruleId: string; count: number }>;
    topFiles: Array<{ file: string; count: number }>;
  };
  findings: Finding[];
  suppressed?: Finding[];
  artifacts?: Record<string, Artifact[]>;
}

/**
 * Generate report from findings
 */
export function generateReport(
  findings: Finding[],
  suppressed: Finding[],
  outputPath: string,
  targets?: TargetSet,
  toolsRun?: string[],
  artifacts?: Record<string, Artifact[]>
): AuditReport {
  const bySeverity = {
    error: 0,
    warn: 0,
    info: 0,
  };

  const byTool: Record<string, number> = {};
  const byRuleId: Record<string, number> = {};
  const byFile: Record<string, number> = {};

  for (const finding of findings) {
    bySeverity[finding.severity]++;
    byTool[finding.tool] = (byTool[finding.tool] || 0) + 1;
    byRuleId[finding.ruleId] = (byRuleId[finding.ruleId] || 0) + 1;
    if (finding.file) {
      byFile[finding.file] = (byFile[finding.file] || 0) + 1;
    }
  }

  const topRuleIds = Object.entries(byRuleId)
    .map(([ruleId, count]) => ({ ruleId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const topFiles = Object.entries(byFile)
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const metadata: AuditReport['metadata'] = {
    mode: targets?.mode || 'full',
    changedFilesCount: targets?.changedFiles.length || 0,
    toolsRun: toolsRun || [],
  };
  
  if (targets?.sinceRef && typeof targets.sinceRef === 'string') {
    metadata.sinceRef = targets.sinceRef;
  }

  const report: AuditReport = {
    generatedAt: new Date().toISOString(),
    metadata,
    summary: {
      totalFindings: findings.length + suppressed.length,
      suppressed: suppressed.length,
      new: findings.length,
      bySeverity,
      byTool,
      topRuleIds,
      topFiles,
    },
    findings,
    ...(suppressed.length > 0 ? { suppressed } : {}),
    ...(artifacts && Object.keys(artifacts).length > 0 ? { artifacts } : {}),
  };

  // Write to file
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(outputPath, JSON.stringify(report, null, 2) + '\n', 'utf8');

  return report;
}
