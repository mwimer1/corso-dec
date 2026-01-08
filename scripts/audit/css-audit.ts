#!/usr/bin/env tsx
/**
 * CSS Audit Orchestrator
 *
 * Main entry point for CSS audit system.
 * Coordinates all tools, handles baseline, and generates reports.
 */

import { join, dirname, resolve } from 'node:path';
import { existsSync } from 'node:fs';
import { Project, SourceFile } from 'ts-morph';
import type {
  CssAuditTool,
  CssAuditConfig,
  ResolvedCliOptions,
  TargetSet,
  WorkspaceIndex,
  ToolContext,
  Finding,
  Severity,
  Artifact,
} from './types';
import { buildTargetSet } from './targets';
import { readBaseline, writeBaseline, filterAgainstBaseline, updateBaseline } from './baseline';
import { generateReport } from './report';
import { getRepoRoot, normalizePath, getRelativePath } from '../lint/_utils/paths';
import { logger } from '../utils/logger';
import { allTools } from './tools';

/**
 * Parse CLI arguments
 */
function parseArgs(): ResolvedCliOptions {
  const args = process.argv.slice(2);
  const options: Partial<ResolvedCliOptions> = {
    changed: false,
    since: 'HEAD~1',
    include: [],
    exclude: [],
    tools: [],
    skipTools: [],
    baselinePath: join(getRepoRoot(), 'css-audit.baseline.json'),
    noBaseline: false,
    updateBaseline: false,
    force: false,
    failOn: 'error',
    strict: false,
    outputPath: join(getRepoRoot(), 'reports/css-audit.json'),
    format: 'json',
    html: false,
    ci: false,
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (!arg) continue;
    const next = args[i + 1];

    switch (arg) {
      case '--changed':
        options.changed = true;
        break;

      case '--since':
        if (next && !next.startsWith('-')) {
          options.since = next;
          i++;
        }
        break;

      case '--include':
        if (next && !next.startsWith('-')) {
          options.include = (options.include || []).concat(next.split(','));
          i++;
        }
        break;

      case '--exclude':
        if (next && !next.startsWith('-')) {
          options.exclude = (options.exclude || []).concat(next.split(','));
          i++;
        }
        break;

      case '--tools':
        if (next && !next.startsWith('-')) {
          options.tools = next.split(',').map(t => t.trim());
          i++;
        }
        break;

      case '--skip-tools':
        if (next && !next.startsWith('-')) {
          options.skipTools = next.split(',').map(t => t.trim());
          i++;
        }
        break;

      case '--baseline':
        if (next && !next.startsWith('-')) {
          options.baselinePath = next;
          i++;
        }
        break;

      case '--no-baseline':
        options.noBaseline = true;
        break;

      case '--update-baseline':
        options.updateBaseline = true;
        break;

      case '--force':
        options.force = true;
        break;

      case '--strict':
        options.strict = true;
        options.failOn = 'warn';
        break;

      case '--fail-on':
        if (next && !next.startsWith('-')) {
          options.failOn = next as Severity;
          i++;
        }
        break;

      case '--output':
      case '-o':
        if (next && !next.startsWith('-')) {
          options.outputPath = next;
          i++;
        }
        break;

      case '--format':
        if (next && !next.startsWith('-')) {
          options.format = next as 'pretty' | 'json' | 'junit';
          i++;
        }
        break;

      case '--json':
        options.format = 'json';
        break;

      case '--junit':
        options.format = 'junit';
        break;

      case '--html':
        options.html = true;
        break;

      case '--ci':
        options.ci = true;
        break;

      case '--help':
      case '-h':
        printHelp();
        process.exit(0);
        break;
    }
  }

  return {
    changed: options.changed ?? false,
    since: options.since ?? 'HEAD~1',
    include: options.include ?? [],
    exclude: options.exclude ?? [],
    tools: options.tools ?? [],
    skipTools: options.skipTools ?? [],
    baselinePath: options.baselinePath ?? join(getRepoRoot(), 'css-audit.baseline.json'),
    noBaseline: options.noBaseline ?? false,
    updateBaseline: options.updateBaseline ?? false,
    force: options.force ?? false,
    failOn: options.strict ? 'warn' : (options.failOn ?? 'error'),
    strict: options.strict ?? false,
    outputPath: options.outputPath ?? join(getRepoRoot(), 'reports/css-audit.json'),
    format: options.format ?? 'json',
    html: options.html ?? false,
    ci: options.ci ?? false,
  };
}

/**
 * Print help message
 */
function printHelp(): void {
  console.log(`
CSS Audit Tool

Usage:
  pnpm audit:css [options]

Options:
  --changed              Only check changed files (requires git)
  --since <ref>          Git ref to compare against (default: HEAD~1)
  --include <pattern>    Include files matching pattern (repeatable)
  --exclude <pattern>    Exclude files matching pattern (repeatable)
  --tools <ids>          Run only specific tools (comma-separated)
  --skip-tools <ids>     Skip specific tools (comma-separated)
  --baseline <path>      Baseline file path (default: css-audit.baseline.json)
  --no-baseline          Don't use baseline (check all findings)
  --update-baseline      Update baseline with current findings
  --force                Allow --update-baseline with --changed
  --strict               Synonym for --fail-on warn
  --fail-on <level>      Fail on findings at or above level (error|warn|info)
--output, -o <path>    Write report to file (default: reports/css-audit.json)
--format <format>      Report format (pretty|json|junit)
--json                 Shortcut for --format json
--junit                Shortcut for --format junit
--html                 Generate HTML report (non-blocking)
--ci                   CI mode
--help, -h             Show this help message

Examples:
  # Run audit on all CSS files
  pnpm audit:css

  # Check only changed files
  pnpm audit:css --changed

  # Update baseline
  pnpm audit:css --update-baseline

  # Run specific tool
  pnpm audit:css --tools stylelint

Available Tools:
  stylelint: Runs stylelint validation
  css-duplicate-styles: Detects duplicate styling sources
  css-paths: Validates CSS file organization
  css-unused-tokens: Finds unused CSS custom properties
  css-size: Monitors CSS bundle size
  css-validate-styles: Validates styling standards
  css-unused-classes: Detects unused CSS module classes
  css-overlapping-rules: Detects duplicate/conflicting CSS rules
  css-best-practices: Enforces cross-file CSS conventions

Fix Tools (require --force or --tools):
  css-purge-styles: Purges unreferenced style files (MUTATING)
`);
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
  _index: WorkspaceIndex
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
        // For CSS modules, return impacted modules from index
        if (targets.mode === 'changed' && _index.impactedCssModules) {
          return Array.from(_index.impactedCssModules);
        }
        // In full mode, return all CSS module files
        return Array.from(new Set(targets.cssModuleFiles));
      }
      return [];
    
    case 'global':
      // Handled by tool itself
      return [];

    default:
      return [];
  }
}

/**
 * Load config from file (if exists)
 */
function loadConfig(rootDir: string): CssAuditConfig {
  const { existsSync, readFileSync } = require('node:fs');
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
    include: [],
    exclude: [],
    tools: {},
  };
}

/**
 * Build workspace index (CSS module importers, impacted modules)
 */
async function buildWorkspaceIndex(
  rootDir: string,
  targets: TargetSet
): Promise<WorkspaceIndex> {
  const index: WorkspaceIndex = {};

  // Check if any tool needs CSS module importers
  const needsImporters = allTools.some(tool => 
    tool.scope.kind === 'entities' && tool.scope.entity === 'cssModule'
  );

  if (!needsImporters) {
    return index;
  }

  // Build CSS module importers map
  const cssModuleImporters = new Map<string, Set<string>>();

  try {
    const project = new Project({
      tsConfigFilePath: join(rootDir, 'tsconfig.json'),
    });

    // Get all CSS module files
    const allCssModules = new Set([
      ...targets.cssModuleFiles,
      // In changed mode, we still need all modules for index
      ...(targets.mode === 'changed' ? await globCSSModules(rootDir) : []),
    ]);

    // Get all source files that might import CSS modules
    const allSourceFiles = project.getSourceFiles().filter(sf => {
      const relPath = getRelativePath(sf.getFilePath());
      return (
        targets.tsFiles.includes(relPath) ||
        targets.tsxFiles.includes(relPath) ||
        (targets.mode === 'changed' && targets.allFiles.includes(relPath))
      );
    });

    // For each source file, find CSS module imports
    for (const sf of allSourceFiles) {
      const importerPath = getRelativePath(sf.getFilePath());

      for (const imp of sf.getImportDeclarations()) {
        const spec = imp.getModuleSpecifierValue();
        if (!spec) continue;

        // Resolve CSS module path
        const resolved = resolveCssModulePath(spec, sf.getFilePath(), rootDir);
        if (resolved && allCssModules.has(resolved)) {
          if (!cssModuleImporters.has(resolved)) {
            cssModuleImporters.set(resolved, new Set());
          }
          cssModuleImporters.get(resolved)!.add(importerPath);
        }
      }
    }

    index.cssModuleImporters = cssModuleImporters;

    // Build impacted CSS modules set (for changed mode)
    if (targets.mode === 'changed') {
      const impactedCssModules = new Set<string>();

      // Changed CSS modules themselves
      for (const file of targets.changedFiles) {
        if (file.endsWith('.module.css')) {
          impactedCssModules.add(file);
        }
      }

      // CSS modules imported by changed TS/TSX files
      for (const file of targets.changedFiles) {
        if (file.endsWith('.ts') || file.endsWith('.tsx')) {
          cssModuleImporters.forEach((importers, modulePath) => {
            if (importers.has(file)) {
              impactedCssModules.add(modulePath);
            }
          });
        }
      }

      index.impactedCssModules = impactedCssModules;
    }
  } catch (error) {
    logger.warn(`Failed to build workspace index: ${error instanceof Error ? error.message : String(error)}`);
  }

  return index;
}

/**
 * Resolve CSS module path from import specifier
 */
function resolveCssModulePath(
  importSpecifier: string,
  importerFile: string,
  rootDir: string
): string | null {
  if (!importSpecifier.endsWith('.module.css') && !importSpecifier.endsWith('.module')) {
    return null;
  }

  // Handle @/ alias
  let resolved: string;
  if (importSpecifier.startsWith('@/')) {
    resolved = join(rootDir, importSpecifier.replace('@/', ''));
  } else if (importSpecifier.startsWith('.')) {
    resolved = resolve(dirname(importerFile), importSpecifier);
  } else {
    return null; // External module
  }

  // Try with .module.css extension
  const withExtension = resolved.endsWith('.module.css') 
    ? resolved 
    : `${resolved}.module.css`;

  if (existsSync(withExtension)) {
    return normalizePath(getRelativePath(withExtension));
  }

  return null;
}

/**
 * Glob all CSS module files
 */
async function globCSSModules(rootDir: string): Promise<string[]> {
  const { glob } = await import('glob');
  try {
    const files = await glob('**/*.module.css', {
      cwd: rootDir,
      ignore: ['**/node_modules/**', '**/.next/**', '**/build/**', '**/dist/**'],
      absolute: false,
    });
    return files.map(f => normalizePath(f));
  } catch {
    return [];
  }
}

/**
 * Print console summary
 */
function printSummary(
  report: ReturnType<typeof generateReport>,
  cli: ResolvedCliOptions
): void {
  if (cli.ci) {
    return; // Skip console output in CI
  }

  console.log('\n' + '='.repeat(60));
  console.log('CSS Audit Summary');
  console.log('='.repeat(60));
  
  // Metadata
  console.log(`Mode: ${report.metadata.mode}`);
  if (report.metadata.mode === 'changed') {
    console.log(`  Changed files: ${report.metadata.changedFilesCount}`);
    if (report.metadata.sinceRef) {
      console.log(`  Since: ${report.metadata.sinceRef}`);
    }
  }
  console.log(`  Tools run: ${report.metadata.toolsRun.join(', ')}`);

  // Findings summary
  console.log(`\nTotal findings: ${report.summary.totalFindings}`);
  console.log(`  New: ${report.summary.new}`);
  console.log(`  Known (suppressed): ${report.summary.suppressed}`);
  
  console.log('\nBy severity:');
  console.log(`  Errors: ${report.summary.bySeverity.error}`);
  console.log(`  Warnings: ${report.summary.bySeverity.warn}`);
  console.log(`  Info: ${report.summary.bySeverity.info}`);

  // Per-tool breakdown
  if (Object.keys(report.summary.byTool).length > 0) {
    console.log('\nFindings by tool:');
    for (const [tool, count] of Object.entries(report.summary.byTool).sort((a, b) => b[1] - a[1])) {
      const indicator = count > 0 ? '⚠️' : '✅';
      console.log(`  ${indicator} ${tool}: ${count}`);
    }
  }

  // Artifacts summary (e.g., CSS size)
  if (report.artifacts && Object.keys(report.artifacts).length > 0) {
    console.log('\nTool artifacts:');
    for (const [tool, artifacts] of Object.entries(report.artifacts)) {
      for (const artifact of artifacts) {
        console.log(`  ${tool}: ${artifact.title || artifact.id} → ${artifact.path}`);
      }
    }
  }

  if (report.summary.topRuleIds.length > 0) {
    console.log('\nTop rule violations:');
    for (const { ruleId, count } of report.summary.topRuleIds.slice(0, 5)) {
      console.log(`  ${ruleId}: ${count}`);
    }
  }

  if (report.summary.topFiles.length > 0) {
    console.log('\nFiles with most issues:');
    for (const { file, count } of report.summary.topFiles.slice(0, 5)) {
      console.log(`  ${file}: ${count}`);
    }
  }

  console.log('='.repeat(60) + '\n');
}

/**
 * Main audit function
 */
async function main(): Promise<void> {
  try {
    const cli = parseArgs();
    const rootDir = getRepoRoot();

    // Validate --update-baseline with --changed
    if (cli.updateBaseline && cli.changed && !cli.force) {
      logger.error('Cannot use --update-baseline with --changed unless --force is set');
      process.exit(1);
    }

    // Load config
    const config = loadConfig(rootDir);
    const mergedInclude = config.include?.length ? config.include : cli.include;
    const mergedExclude = config.exclude?.length ? config.exclude : cli.exclude;

    // Build targets
    logger.info('Computing target files...');
    const targets = await buildTargetSet({
      rootDir,
      changed: cli.changed,
      since: cli.since,
      include: mergedInclude,
      exclude: mergedExclude,
    });

    logger.info(`Found ${targets.allFiles.length} target files`);

    // Build workspace index
    logger.info('Building workspace index...');
    const index = await buildWorkspaceIndex(rootDir, targets);

    // Create tool context
    const ctx = createToolContext(rootDir, config, cli, targets, index);

    // Include purge tool in tools registry if explicitly requested
    const toolsRegistry: CssAuditTool[] = [...allTools];
    
    // Add purge tool if explicitly requested via --tools
    if (cli.tools.includes('css-purge-styles') || cli.force) {
      if (!toolsRegistry.find(t => t.id === 'css-purge-styles')) {
        const { purgeStylesTool } = await import('./tools/purge-styles');
        toolsRegistry.push(purgeStylesTool);
      }
    }

    // Filter tools (default: only audit tools, not fix tools)
    let enabledTools = toolsRegistry.filter(t => t.defaultEnabled !== false);

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
    let baseline = cli.noBaseline
      ? { version: '1.0', generatedAt: new Date().toISOString(), entries: [] }
      : readBaseline(cli.baselinePath);

    // Run tools
    const allFindings: Finding[] = [];
    const toolStats: Record<string, number> = {};
    const toolArtifacts: Record<string, Artifact[]> = {};

    logger.info(`Running ${enabledTools.length} tool(s)...`);

    for (const tool of enabledTools) {
      try {
        // Global tools don't need target filtering
        if (tool.scope.kind === 'global') {
          const toolCtx: ToolContext = {
            ...ctx,
            targets: targets, // Use full targets for global tools
          };

          const toolConfig = config.tools?.[tool.id] ?? {};
          const result = await tool.run(toolCtx, toolConfig);
          allFindings.push(...result.findings);
          toolStats[tool.id] = result.findings.length;
          if (result.artifacts) {
            toolArtifacts[tool.id] = result.artifacts;
          }
          continue;
        }

        // Entities scope tools (like css-unused-classes) handle their own target logic
        if (tool.scope.kind === 'entities') {
          const toolCtx: ToolContext = {
            ...ctx,
            targets: targets, // Use full targets, tool extracts entities from index
          };

          const toolConfig = config.tools?.[tool.id] ?? {};
          const result = await tool.run(toolCtx, toolConfig);
          allFindings.push(...result.findings);
          toolStats[tool.id] = result.findings.length;
          if (result.artifacts) {
            toolArtifacts[tool.id] = result.artifacts;
          }
          continue;
        }

        // Files scope tools - filter targets
        const toolTargets = getToolTargets(tool, targets, index);
        
        // Create tool-specific target set
        const toolTargetSet: TargetSet = {
          ...targets,
          allFiles: toolTargets,
          cssFiles: toolTargets.filter(f => f.endsWith('.css') && !f.endsWith('.module.css')),
          cssModuleFiles: toolTargets.filter(f => f.endsWith('.module.css')),
          tsFiles: toolTargets.filter(f => f.endsWith('.ts') && !f.endsWith('.tsx')),
          tsxFiles: toolTargets.filter(f => f.endsWith('.tsx') || f.endsWith('.ts')),
        };

        const toolCtx: ToolContext = {
          ...ctx,
          targets: toolTargetSet,
        };

        const toolConfig = config.tools?.[tool.id] ?? {};

        const result = await tool.run(toolCtx, toolConfig);
        allFindings.push(...result.findings);
        toolStats[tool.id] = result.findings.length;
        if (result.artifacts) {
          toolArtifacts[tool.id] = result.artifacts;
        }
      } catch (error) {
        ctx.warn(`Tool ${tool.id} failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Normalize and dedupe
    const normalizedFindings = normalizeFindings(allFindings);

    // Apply baseline filtering
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
      baseline = updateBaseline(baseline, newFindings, enabledTools, ctx);
      writeBaseline(cli.baselinePath, baseline);
      logger.info(`Baseline updated: ${cli.baselinePath}`);
    }

    // Generate report
    const toolsRunNames = enabledTools.map(t => t.id);
    const report = generateReport(
      newFindings,
      suppressed,
      cli.outputPath,
      targets,
      toolsRunNames,
      toolArtifacts
    );
    logger.info(`Report written to: ${cli.outputPath}`);

    // Generate HTML report if requested
    if (cli.html) {
      const { generateHtmlReport } = await import('./html-report');
      const htmlPath = cli.outputPath.replace(/\.json$/, '.html');
      generateHtmlReport(cli.outputPath, htmlPath);
      logger.info(`HTML report written to: ${htmlPath}`);
    }

    // Print console summary
    printSummary(report, cli);

    // Exit based on --fail-on threshold (only NEW findings)
    const hasFailures = cli.failOn === 'error'
      ? report.summary.bySeverity.error > 0
      : cli.failOn === 'warn'
      ? (report.summary.bySeverity.error > 0 || report.summary.bySeverity.warn > 0)
      : newFindings.length > 0;

    if (hasFailures) {
      process.exit(1);
    }
  } catch (error) {
    logger.error('CSS audit failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}
