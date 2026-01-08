#!/usr/bin/env tsx
/**
 * CSS Audit Orchestrator
 *
 * Coordinates all CSS audit tools, handles target calculation, baseline management,
 * and reporting. Owns all the tricky flag/baseline behavior.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  CssAuditTool,
  CssAuditConfig,
  ResolvedCliOptions,
  TargetSet,
  WorkspaceIndex,
  ToolContext,
  ToolRunResult,
  Finding,
  FileKind,
  SeverityCounts,
} from './types';
import { buildTargetSet } from './target-builder';
import { buildWorkspaceIndex } from './index-builder';
import { readBaseline, writeBaseline, filterAgainstBaseline, updateBaseline, pruneBaseline } from './baseline';
import { getRepoRoot, getRelativePath } from '../../lint/_utils/paths';
import { logger } from '../../utils/logger';

export interface AuditResult {
  findings: Finding[];
  suppressed: Finding[];
  stats: {
    totalFindings: number;
    suppressedCount: number;
    newCount: number;
    bySeverity: SeverityCounts;
    byTool: Record<string, number>;
  };
}

/**
 * Create tool context
 */
function createToolContext(
  rootDir: string,
  config: CssAuditConfig,
  cli: ResolvedCliOptions,
  targets: TargetSet,
  index: WorkspaceIndex
): ToolContext {
  return {
    rootDir,
    config,
    cli,
    targets,
    index,
    log: (msg: string) => {
      if (!cli.ci) {
        logger.info(msg);
      }
    },
    warn: (msg: string) => {
      if (!cli.ci) {
        logger.warn(msg);
      }
    },
  };
}

/**
 * Get tool targets based on scope
 */
function getToolTargets(
  tool: CssAuditTool,
  targets: TargetSet,
  index: WorkspaceIndex
): string[] {
  const scope = tool.scope;

  switch (scope.kind) {
    case 'files': {
      const fileSet = new Set<string>();

      for (const kind of scope.kinds) {
        switch (kind) {
          case 'css':
            targets.cssFiles.forEach(f => fileSet.add(f));
            break;
          case 'cssModule':
            targets.cssModuleFiles.forEach(f => fileSet.add(f));
            break;
          case 'ts':
            targets.tsFiles.forEach(f => fileSet.add(f));
            break;
          case 'tsx':
            targets.tsxFiles.forEach(f => fileSet.add(f));
            break;
          case 'all':
            targets.allFiles.forEach(f => fileSet.add(f));
            break;
        }
      }

      return Array.from(fileSet);
    }

    case 'entities':
      if (scope.entity === 'cssModule') {
        if (targets.mode === 'changed' && index.impactedCssModules) {
          return Array.from(index.impactedCssModules);
        }
        return targets.cssModuleFiles;
      }
      return [];

    case 'global':
      // Global tools run once regardless of changed/full
      return [];

    default:
      return [];
  }
}

/**
 * Normalize and dedupe findings by fingerprint
 */
function normalizeFindings(findings: Finding[]): Finding[] {
  const seen = new Map<string, Finding>();
  
  for (const finding of findings) {
    const existing = seen.get(finding.fingerprint);
    if (!existing) {
      seen.set(finding.fingerprint, finding);
    }
  }
  
  return Array.from(seen.values());
}

/**
 * Load config from file
 */
function loadConfig(rootDir: string, cli: ResolvedCliOptions): CssAuditConfig {
  const configPath = join(rootDir, '.css-audit.config.json');
  if (existsSync(configPath)) {
    try {
      const content = readFileSync(configPath, 'utf8');
      return JSON.parse(content) as CssAuditConfig;
    } catch {
      // Invalid config, return default
    }
  }

  return {
    include: cli.include,
    exclude: cli.exclude,
    tools: {},
  };
}

/**
 * Run CSS audit
 */
export async function runCssAudit(
  tools: CssAuditTool[],
  cli: ResolvedCliOptions
): Promise<AuditResult> {
  const rootDir = getRepoRoot();
  const config = loadConfig(rootDir, cli);

  // Build targets
  const targets = await buildTargetSet({
    rootDir,
    changed: cli.changed,
    since: cli.since,
    include: config.include ?? cli.include,
    exclude: config.exclude ?? cli.exclude,
  });

  // Build workspace index
  const index = buildWorkspaceIndex(
    rootDir,
    targets.changedFiles,
    targets.tsFiles,
    targets.tsxFiles,
    targets.cssModuleFiles
  );

  // Create tool context
  const ctx = createToolContext(rootDir, config, cli, targets, index);

  // Filter tools by CLI options
  let enabledTools = tools.filter(t => t.defaultEnabled !== false);
  
  if (cli.tools.length > 0) {
    enabledTools = enabledTools.filter(t => cli.tools.includes(t.id));
  }

  if (cli.skipTools.length > 0) {
    enabledTools = enabledTools.filter(t => !cli.skipTools.includes(t.id));
  }

  // Exclude fix tools unless explicitly enabled
  enabledTools = enabledTools.filter(t => {
    if (t.category === 'fix') {
      return cli.force || cli.tools.includes(t.id);
    }
    return true;
  });

  // Load baseline
  let baseline = readBaseline(cli.baselinePath);
  
  if (!cli.noBaseline && cli.updateBaseline) {
    // Prune baseline for files that no longer exist
    const existingFiles = new Set([
      ...targets.cssFiles,
      ...targets.cssModuleFiles,
      ...targets.tsFiles,
      ...targets.tsxFiles,
    ]);
    baseline = pruneBaseline(baseline, existingFiles);
  }

  // Run tools
  const allFindings: Finding[] = [];
  const toolStats: Record<string, number> = {};

  for (const tool of enabledTools) {
    try {
      ctx.log(`Running ${tool.title}...`);

      // Get tool-specific targets
      const toolTargets = getToolTargets(tool, targets, index);

      // Apply tool-level includes/excludes
      let filteredTargets = toolTargets;
      if (tool.include || tool.exclude) {
        filteredTargets = toolTargets.filter(file => {
          if (tool.exclude?.some(pattern => file.includes(pattern))) {
            return false;
          }
          if (tool.include && tool.include.length > 0) {
            return tool.include.some(pattern => file.includes(pattern));
          }
          return true;
        });
      }

      // Create tool-specific context with filtered targets
      const toolTargetSet: TargetSet = {
        ...targets,
        allFiles: filteredTargets,
        cssFiles: filteredTargets.filter(f => f.endsWith('.css') && !f.endsWith('.module.css')),
        cssModuleFiles: filteredTargets.filter(f => f.endsWith('.module.css')),
        tsFiles: filteredTargets.filter(f => f.endsWith('.ts') && !f.endsWith('.tsx')),
        tsxFiles: filteredTargets.filter(f => f.endsWith('.tsx') || f.endsWith('.ts')),
      };

      const toolCtx: ToolContext = {
        ...ctx,
        targets: toolTargetSet,
      };

      const toolConfig = config.tools?.[tool.id] ?? {};

      // Run tool
      const result: ToolRunResult = await tool.run(toolCtx, toolConfig);

      // Collect findings
      allFindings.push(...result.findings);
      toolStats[tool.id] = result.findings.length;

      ctx.log(`  Found ${result.findings.length} findings`);
    } catch (error) {
      ctx.warn(`Tool ${tool.id} failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Normalize findings (dedupe by fingerprint) before filtering
  const normalizedFindings = normalizeFindings(allFindings);

  // Filter against baseline
  let suppressed: Finding[] = [];
  let newFindings: Finding[] = [];

  if (!cli.noBaseline) {
    const filtered = filterAgainstBaseline(normalizedFindings, baseline);
    suppressed = filtered.suppressed;
    newFindings = filtered.new;
  } else {
    newFindings = normalizedFindings;
  }

  // Update baseline if requested
  if (cli.updateBaseline) {
    // Pass ALL findings (normalized) to updateBaseline, not just newFindings
    // This ensures baseline refresh correctly includes already-baselined findings
    // and properly prunes fixed findings
    baseline = updateBaseline(baseline, normalizedFindings, enabledTools, ctx);
    writeBaseline(cli.baselinePath, baseline);
    ctx.log(`Baseline updated: ${cli.baselinePath}`);
  }

  // Calculate stats
  const bySeverity: SeverityCounts = {
    error: 0,
    warn: 0,
    info: 0,
  };

  for (const finding of newFindings) {
    bySeverity[finding.severity] = bySeverity[finding.severity] + 1;
  }

  const stats = {
    totalFindings: allFindings.length,
    suppressedCount: suppressed.length,
    newCount: newFindings.length,
    bySeverity,
    byTool: toolStats,
  };

  return {
    findings: newFindings,
    suppressed,
    stats,
  };
}
