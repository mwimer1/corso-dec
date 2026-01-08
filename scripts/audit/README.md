# CSS Audit System

Systematic CSS audit tool that reviews all CSS files for issues, duplicates, and best practice violations.

The CSS audit system provides comprehensive analysis of CSS files using multiple specialized tools, with baseline management for tracking known issues and focusing on new problems.

## Quick Start

```bash
# Run audit on all CSS files (all audit tools)
pnpm audit:css

# Check only changed files
pnpm audit:css:changed

# Refresh baseline for tools that ran (adds new findings, prunes fixed ones)
pnpm audit:css:baseline

# Run fix tools (mutating - use with caution)
pnpm audit:css:fix
```

## How It Works

### Baseline System

The audit uses a baseline file (`css-audit.baseline.json`) to suppress known issues while tracking new ones:

1. **First run**: Run `pnpm audit:css` to see all findings
2. **Review findings**: Decide which findings are acceptable (e.g., existing technical debt)
3. **Refresh baseline**: Run `pnpm audit:css:baseline` to refresh baseline entries for tools that ran
4. **Future runs**: Only new findings will be reported

The baseline file should be committed to the repository so the team shares the same suppressed findings.

### Changed File Detection

Use `--changed` mode to only check files that have changed:

```bash
# Check files changed since HEAD~1 (default)
pnpm audit:css --changed

# Check files changed since a specific commit
pnpm audit:css --changed --since origin/main
```

The `--since` option accepts any git ref (commit hash, branch name, etc.).

**Merge-Base Semantics**: Changed file detection uses git's triple-dot syntax (`since...HEAD`) which automatically computes the merge-base for branch comparisons. This ensures that only files changed on your branch are detected, even if the target branch (e.g., `origin/main`) has diverged with new commits.

- **Preferred method**: `git diff --name-only --diff-filter=ACMR ${since}...HEAD` (uses merge-base automatically)
- **Fallback method**: If triple-dot fails (e.g., invalid ref), falls back to direct diff: `git diff --name-only --diff-filter=ACMR ${since} HEAD`
- **Failure handling**: If changed file detection fails in `--changed` mode, the tool automatically falls back to full scan mode with a warning, ensuring it never silently produces an empty audit result.

### Exit Codes

The tool exits with:
- **0**: No findings above the `--fail-on` threshold (default: errors only)
- **1**: Findings found above threshold

Use `--strict` to fail on warnings, or `--fail-on warn` / `--fail-on info` for stricter checks.

## CLI Options

```
--changed              Only check changed files (requires git)
--since <ref>          Git ref to compare against (default: HEAD~1)
--include <pattern>    Include files matching pattern (repeatable)
--exclude <pattern>    Exclude files matching pattern (repeatable)
--tools <ids>          Run only specific tools (comma-separated)
--skip-tools <ids>     Skip specific tools (comma-separated)
--baseline <path>      Baseline file path (default: css-audit.baseline.json)
--no-baseline          Don't use baseline (check all findings)
--update-baseline      Refresh baseline entries for tools that ran (adds new, prunes fixed, preserves for tools not run)
--force                Allow --update-baseline with --changed
--strict               Synonym for --fail-on warn
--fail-on <level>      Fail on findings at or above level (error|warn|info)
--output, -o <path>    Write report to file (default: reports/css-audit.json)
--format <format>      Report format (pretty|json|junit)
--json                 Shortcut for --format json
--junit                Shortcut for --format junit
--html                 Generate HTML report (reads JSON, writes HTML)
--ci                   CI mode (minimal output, suitable for CI)
--help, -h             Show this help message
```

## Report Format

Reports are written to `reports/css-audit.json` by default and include:

- **Metadata**: Mode (full/changed), since ref, changed files count, tools run
- **Summary**: Total findings, by severity, by tool, top rule violations, top files
- **Findings**: List of all new findings (not in baseline)
- **Suppressed**: List of findings suppressed by baseline (optional)
- **Artifacts**: Tool-generated artifacts (e.g., CSS size reports)

### Example Report Structure

```json
{
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "metadata": {
    "mode": "changed",
    "sinceRef": "HEAD~1",
    "changedFilesCount": 5,
    "toolsRun": ["stylelint", "css-validate-styles"]
  },
  "summary": {
    "totalFindings": 12,
    "suppressed": 3,
    "new": 9,
    "bySeverity": { "error": 0, "warn": 9, "info": 0 },
    "byTool": {
      "stylelint": 6,
      "css-validate-styles": 3
    },
    "topRuleIds": [...],
    "topFiles": [...]
  },
  "findings": [...],
  "artifacts": {
    "css-size": [{ "id": "css-size-report", "path": "styles/build/tailwind.css", ... }]
  }
}
```

### HTML Report (Optional)

Generate a visual HTML report from the JSON output:

```bash
# Generate HTML report after JSON report
pnpm audit:css --html

# HTML report is written to reports/css-audit.html
```

The HTML report provides:
- Summary cards with key metrics
- Color-coded findings by severity
- Top rule violations and files
- Detailed finding information with hints
- Responsive design for easy viewing

## Available Tools

### Audit Tools (Safe - Non-Mutating)

These tools are enabled by default and perform read-only analysis:

#### stylelint
- **ID**: `stylelint`
- **Scope**: CSS files and CSS modules
- **Severity**: Error/Warn (configurable)
- **What it checks**: 
  - Stylelint rule violations (colors, spacing, selector patterns, etc.)
  - Max nesting depth (3 levels)
  - `!important` usage (warn)
  - Unknown properties
  - Color token enforcement
  - Selector class patterns
- **Output**: Findings with stable fingerprints (don't change on reformatting)
- **Baseline**: Warn and error findings

#### css-duplicate-styles
- **ID**: `css-duplicate-styles`
- **Scope**: CSS files and CSS modules
- **Severity**: Warn
- **What it checks**: Duplicate styling sources (both pattern CSS and component CSS for same component)
- **Output**: Findings for each duplicate pair
- **Baseline**: All findings

#### css-paths
- **ID**: `css-paths`
- **Scope**: CSS files
- **Severity**: Error
- **What it checks**: CSS files located outside the `styles/` directory
- **Output**: Findings for each stray CSS file
- **Baseline**: All findings

#### css-unused-tokens
- **ID**: `css-unused-tokens`
- **Scope**: CSS files
- **Severity**: Warn
- **What it checks**: CSS custom properties defined but never referenced via `var(--token-name)`
- **Note**: Only detects direct `var()` usage, not Tailwind class usage (use allowlist for Tailwind-integrated tokens)
- **Output**: Findings for each unused token
- **Baseline**: Warn-only (many tokens are Tailwind-integrated)

#### css-size
- **ID**: `css-size`
- **Scope**: Global (runs on entire repo)
- **Severity**: Error
- **What it checks**: CSS bundle size (`styles/build/tailwind.css`) exceeds 150KB limit
- **Output**: Error finding if size exceeds limit, plus artifact with size info
- **Baseline**: All findings

#### css-validate-styles
- **ID**: `css-validate-styles`
- **Scope**: CSS files, CSS modules, TSX files
- **Severity**: Warn
- **What it checks**: 
  - Inline style attributes with hardcoded colors/spacing
  - Hardcoded hex/RGB colors in CSS (should use tokens)
  - Hardcoded pixel/rem spacing in CSS (should use tokens)
- **Output**: Findings for each violation
- **Baseline**: All findings

#### css-unused-classes
- **ID**: `css-unused-classes`
- **Scope**: CSS modules (entity scope)
- **Severity**: Warn (high confidence) / Info (low confidence)
- **What it checks**: Unused CSS module classes using PostCSS and TypeScript AST analysis
- **Output**: Findings for unused classes with confidence level
- **Baseline**: Warn-level only (high confidence findings)

#### css-overlapping-rules
- **ID**: `css-overlapping-rules`
- **Scope**: CSS files and CSS modules
- **Severity**: Warn/Info
- **What it checks**:
  - Exact duplicate declaration blocks across files
  - Same selector repeated in same file with conflicting declarations
- **Output**: Findings for duplicates and conflicts
- **Baseline**: All findings (warn and info)

#### css-best-practices
- **ID**: `css-best-practices`
- **Scope**: CSS files and CSS modules
- **Severity**: Warn/Error
- **What it checks**:
  - `:global()` usage outside allowed directories (warn)
  - New files under `styles/legacy/*` (error)
- **Output**: Findings for convention violations
- **Baseline**: All findings except info

### Fix Tools (Mutating - Require Explicit Enable)

These tools modify files and are **NOT** enabled by default:

#### css-purge-styles
- **ID**: `css-purge-styles`
- **Category**: `fix` (mutating)
- **What it does**: Purges unreferenced style source files after trimming barrels
- **How to run**: `pnpm audit:css:fix` or `pnpm audit:css --force --tools css-purge-styles`
- **Safety**: Dry-run by default, requires `--write` flag to actually delete files

## Configuration

Create `.css-audit.config.json` in the repo root:

```json
{
  "include": ["styles/**", "components/**"],
  "exclude": ["**/node_modules/**", "**/build/**"],
  "tools": {
    "css-unused-classes": {
      "ignoreClassNamePatterns": ["^legacy-*", "^deprecated-*"],
      "ignoreFiles": ["components/legacy/**/*.module.css"]
    },
    "css-best-practices": {
      "allowGlobalIn": ["components/landing/**"],
      "allowLegacyDirectory": false
    }
  }
}
```

### Tool-Specific Configuration

#### css-unused-classes
- `ignoreClassNamePatterns`: string[] - Regex patterns for class names to ignore
- `ignoreFiles`: string[] - File paths to skip entirely

#### css-best-practices
- `allowGlobalIn`: string[] - Directory patterns where `:global()` is allowed
- `allowLegacyDirectory`: boolean - Allow new files in `styles/legacy/` (default: false)

## Baseline Format

The baseline file (`css-audit.baseline.json`) has this structure:

```json
{
  "version": "1.0",
  "generatedAt": "2024-01-01T00:00:00.000Z",
  "entries": [
    {
      "fingerprint": "stylelint:color-no-hex:styles/main.css:...",
      "tool": "stylelint",
      "ruleId": "stylelint/color-no-hex",
      "severity": "warn",
      "addedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

Fingerprints are stable across code changes (they don't include line/column numbers), so the baseline remains valid even after reformatting.

## Integration

### Local Development

**Recommended workflow:**
```bash
# Quick check on changed files (fast, for pre-commit)
pnpm audit:css:changed

# Full audit before committing significant changes
pnpm audit:css

# Generate visual HTML report (optional, nice-to-have)
pnpm audit:css --html
# or
pnpm audit:css:html

# Update baseline after reviewing acceptable findings
pnpm audit:css:baseline
```

### Changed Mode vs Full Mode

**Changed Mode (`--changed`)**:
- Only analyzes files changed since `HEAD~1` (or `--since` ref)
- Fast for incremental checks
- Ideal for pre-commit hooks and PR validation
- Cross-file tools (like overlapping rules) still check all files but only report if changed files are involved

**Full Mode (default)**:
- Analyzes all CSS files in the repository
- Slower but comprehensive
- Best for initial audits, major refactors, or periodic health checks

### CI/CD Integration

#### Pull Request Validation

**Recommended PR command:**
```yaml
- name: CSS Audit (Changed Files)
  run: pnpm audit:css:changed
```

This command:
- Only checks changed files (fast)
- Fails on new errors by default
- Fails on new warnings if `--strict` is used
- Does NOT update baseline (baseline updates are manual)

**Strict PR validation** (optional):
```yaml
- name: CSS Audit (Strict)
  run: pnpm audit:css:changed --strict
```

#### Main Branch / Nightly

**Recommended nightly/main branch command:**
```yaml
- name: CSS Audit (Full)
  run: pnpm audit:css --strict
```

This provides comprehensive coverage and catches regressions.

**With JUnit output for CI:**
```yaml
- name: CSS Audit
  run: pnpm audit:css:changed --ci --junit
```

The `--ci` flag uses minimal console output, and `--junit` writes results in JUnit XML format for CI parsers.

### Pre-commit Hook

Add to `.husky/pre-commit`:

```bash
pnpm audit:css:changed
```

**Note**: Pre-commit hooks should use `--changed` mode for speed. Full audits are better suited for CI or explicit local runs.

## Baseline Update Policy

### When to Update Baseline

The baseline should be updated when:
1. **Acceptable technical debt**: Findings that are intentionally deferred
2. **False positives**: Known issues that are acceptable in context
3. **Migration periods**: During large refactors, temporarily baseline existing issues

### Who Can Update Baseline

**Best practices:**
- **Developers**: Can update baseline for their own changes during development
- **Code review**: Baseline updates should be reviewed like code changes
- **Team lead**: For major baseline updates affecting many files

**Process:**
1. Review findings from `pnpm audit:css`
2. Determine which findings are acceptable (document why if not obvious)
3. Run `pnpm audit:css:baseline` to update baseline
4. Commit both code changes and baseline update together

### Baseline Governance

- **Review periodically**: Remove entries for fixed issues (handled automatically by `--update-baseline`)
- **Don't baseline errors**: Only baseline warnings and info-level findings (unless truly acceptable)
- **Document intent**: Use baseline entry `note` field for context
- **Keep baseline small**: If baseline grows too large, consider fixing issues incrementally

### Baseline Refresh Semantics

When using `--update-baseline`, the baseline is refreshed for tools that **actually ran successfully**:

- **For tools that ran**: Baseline reflects the current set of baseline-eligible findings
  - New baseline-eligible findings are added (based on tool's `baselineInclude` or default filter)
  - Existing findings that still exist are preserved (with `addedAt` and `note` preserved)
  - Findings that are no longer present (fixed) are automatically pruned
  - Entries are sorted deterministically (by tool, ruleId, fingerprint)
- **For tools that did NOT run**: Baseline entries are preserved unchanged
- **Tool-specific refresh**: If running a subset of tools (via `--tools` or `--skip-tools`), only those tools' baseline entries are refreshed; other tools' entries remain untouched
- **Tool failures**: If a tool is enabled but fails to execute, its baseline entries are preserved (not pruned), ensuring baseline stability even when tools encounter errors

This ensures the baseline accurately reflects the current state while preserving entries for tools that weren't executed in this run. The baseline update is deterministic and preserves metadata (`addedAt`, `note`) from existing entries to minimize churn.

## Suppression vs Baseline

### When to Use Suppression Comments

Use CSS comment suppression (`/* css-audit-ignore unused-class */`) for:
- **Local exceptions**: Issues in specific files that are intentional
- **Short-term workarounds**: Temporary fixes that will be addressed
- **Third-party code**: Styling for external libraries/components

### When to Use Baseline

Use baseline updates for:
- **Widespread issues**: Findings across many files (e.g., legacy codebase patterns)
- **Known technical debt**: Issues that are acceptable but will be fixed incrementally
- **Migration state**: During refactors, baseline existing patterns temporarily

### Best Practice

**Prefer suppression comments** for specific, localized issues.  
**Prefer baseline** for widespread, acceptable patterns.

## Safe vs Fix Tools

### Safe Tools (Default)

All audit tools are **safe** (read-only) and enabled by default:
- `stylelint` - Linting violations (nesting depth, !important, unknown properties, tokens)
- `css-duplicate-styles` - Duplicate styling sources
- `css-paths` - File organization
- `css-unused-tokens` - Unused CSS variables
- `css-size` - Bundle size monitoring
- `css-validate-styles` - Inline styles and hardcoded values
- `css-unused-classes` - Unused CSS module classes (PostCSS + TypeScript AST)
- `css-overlapping-rules` - Duplicate/conflicting rules
- `css-best-practices` - Cross-file conventions (:global usage, legacy directory)

These tools only analyze code and report findings. They never modify files.

### Fix Tools (Require Explicit Enable)

Fix tools are **mutating** and must be explicitly enabled:
- `css-purge-styles` - Deletes unreferenced style files

**To run fix tools:**
```bash
# Run only fix tools
pnpm audit:css:fix

# Or explicitly enable with --tools
pnpm audit:css --force --tools css-purge-styles
```

**Safety**: Fix tools are designed with safety in mind:
- Default to dry-run mode
- Require explicit flags to perform mutations
- Can be run with `--force` or explicit `--tools` selection

## Troubleshooting

**Issue**: Too many findings to fix at once
- Solution: Update baseline with acceptable findings, fix issues incrementally

**Issue**: Baseline file growing too large
- Solution: Periodically review and remove entries for fixed issues

**Issue**: False positives from unused tokens
- Solution: Add tokens used via Tailwind to `styles/tokens/UNUSED.allowlist.json`

**Issue**: Tool takes too long
- Solution: Use `--changed` mode for incremental checks, or `--tools` to run specific tools only

**Issue**: CSS size tool reports missing bundle
- Solution: Run `pnpm build` first to generate `styles/build/tailwind.css`

**Issue**: HTML report not generating
- Solution: Ensure JSON report exists first. HTML report reads from the JSON report file.

## Stylelint Best Practices

Most best practices are enforced via Stylelint configuration (`config/.stylelintrc.cjs`):

- **Max nesting depth**: 3 levels (prevents overly complex selectors)
- **`!important` warnings**: Warns on `!important` usage (prefer specificity)
- **Unknown properties**: Errors on unknown CSS properties (catches typos)
- **Color tokens**: Enforces `hsl(var(--token))` pattern instead of hardcoded colors
- **Selector patterns**: Enforces class naming conventions

See `config/.stylelintrc.cjs` for complete rule configuration.
