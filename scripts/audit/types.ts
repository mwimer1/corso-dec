#!/usr/bin/env tsx
/**
 * CSS Audit System - Core Types & Interfaces
 *
 * Minimal, declarative tool adapter interface that lets the orchestrator
 * own all the tricky flag/baseline behavior.
 */

export type Severity = 'error' | 'warn' | 'info';

export type SeverityCounts = {
  error: number;
  warn: number;
  info: number;
};

export interface Finding {
  tool: string;          // stable tool id, e.g. "stylelint"
  ruleId: string;        // stable rule id, e.g. "stylelint/color-no-hex"
  severity: Severity;

  file?: string;         // path relative to repo root (preferred)
  line?: number;
  col?: number;

  message: string;
  hint?: string;

  // Must be stable across line moves / formatting (must NOT include line/col)
  fingerprint: string;

  data?: Record<string, unknown>;
}

export type FileKind =
  | 'css'
  | 'cssModule'
  | 'ts'
  | 'tsx'
  | 'js'
  | 'jsx'
  | 'mdx'
  | 'all';

export type ToolCategory = 'audit' | 'fix';

/**
 * Declarative scope:
 * - files: tool can run on a list of files
 * - entities: tool runs on a list of entities (e.g. css modules) and may still use repo-wide indexes
 * - global: tool runs on the repo (bundle size, etc.), ignore --changed
 */
export type ToolScope =
  | { kind: 'files'; kinds: FileKind[] }
  | { kind: 'entities'; entity: 'cssModule'; impactedBy: FileKind[] }
  | { kind: 'global' };

export interface Artifact {
  id: string;            // stable id per tool, e.g. "stylelint-raw"
  path: string;          // written by tool or orchestrator
  kind: 'json' | 'text' | 'html';
  title?: string;
}

export interface ToolRunResult {
  findings: Finding[];
  stats?: Record<string, number>;
  artifacts?: Artifact[];
}

export interface TargetSet {
  mode: 'full' | 'changed';
  sinceRef?: string;
  changedFiles: string[];

  // Pre-filtered by global include/exclude
  cssFiles: string[];
  cssModuleFiles: string[];
  tsFiles: string[];
  tsxFiles: string[];
  allFiles: string[];
}

/**
 * Precomputed workspace indexes that multiple tools can share.
 * Keep minimal; add only when a second tool needs the same thing.
 */
export interface WorkspaceIndex {
  // css module -> importers (TS/TSX)
  cssModuleImporters?: Map<string, Set<string>>;

  // optional: changed->impacted css modules (can be computed from importers map)
  impactedCssModules?: Set<string>;
}

export interface CssAuditConfig {
  // global config + tool configs
  tools?: Record<string, unknown>;
  include?: string[];
  exclude?: string[];
}

export interface ResolvedCliOptions {
  changed: boolean;
  since: string;
  include: string[];
  exclude: string[];
  tools: string[];
  skipTools: string[];
  baselinePath: string;
  noBaseline: boolean;
  updateBaseline: boolean;
  force: boolean;

  failOn: Severity;      // 'error'|'warn'|'info'
  strict: boolean;       // synonym for failOn='warn'
  outputPath: string;
  format: 'pretty' | 'json' | 'junit';
  html: boolean;         // Generate HTML report
  ci: boolean;
}

export interface ToolContext {
  rootDir: string;
  config: CssAuditConfig;
  cli: ResolvedCliOptions;

  targets: TargetSet;
  index: WorkspaceIndex;

  // minimal logging hooks
  log: (msg: string) => void;
  warn: (msg: string) => void;
}

export interface CssAuditTool {
  id: string;                // stable unique id (used in findings.tool)
  title: string;
  description?: string;

  category?: ToolCategory;   // default 'audit'
  scope: ToolScope;

  defaultEnabled?: boolean;  // default true for audit tools, false for fix tools

  /**
   * Optional tool-level includes/excludes (in addition to global CLI/config).
   * Orchestrator applies these before passing targets to the tool.
   */
  include?: string[];
  exclude?: string[];

  /**
   * Called by orchestrator with precomputed targets and indexes.
   * Must NOT mutate repo unless category === 'fix' and user explicitly enabled it.
   */
  run: (ctx: ToolContext, toolConfig: unknown) => Promise<ToolRunResult>;

  /**
   * Controls what gets written into the global baseline when --update-baseline is used.
   * If absent, orchestrator default is: include findings with severity !== 'info'
   * (tools override when they need stricter baselining, e.g. warn-only).
   */
  baselineInclude?: (finding: Finding, ctx: ToolContext) => boolean;
}
