# CSS Audit System

Comprehensive CSS audit system that systematically reviews all CSS files for overlap, dead styles, deviations from best practices, and more.

## Overview

The CSS audit system provides:

- **Unused CSS classes detection**: Finds unused classes in CSS modules using AST parsing
- **Overlapping rules detection**: Identifies duplicate or conflicting CSS rules across files
- **Best practices validation**: Checks for hardcoded values, token usage, accessibility issues
- **Baseline management**: Suppress known issues while tracking new ones
- **Multiple output formats**: Pretty console output, JSON, or JUnit XML for CI

## Quick Start

```bash
# Run audit on all CSS files
pnpm css:audit

# Check only changed files
pnpm css:audit:changed

# Update baseline (suppress current findings)
pnpm css:audit:update-baseline

# CI mode (JUnit output)
pnpm css:audit:ci
```

## Architecture

### Tool Adapter Interface

Tools implement a minimal interface that lets the orchestrator own all the complexity:

- **Target calculation**: Orchestrator handles changed file detection, filtering
- **Baseline management**: Orchestrator manages baseline updates and filtering
- **Workspace indexing**: Shared indexes (CSS module importers) computed once

### Tools

Each tool implements the `CssAuditTool` interface:

```typescript
interface CssAuditTool {
  id: string;
  title: string;
  scope: ToolScope;
  run: (ctx: ToolContext, config: unknown) => Promise<ToolRunResult>;
  baselineInclude?: (finding: Finding) => boolean;
}
```

### Current Tools

1. **css-unused-classes**: Detects unused CSS classes in CSS modules
   - Scope: `entities` (CSS modules, impacted by TS/TSX changes)
   - Uses AST parsing for accurate detection

2. **css-overlapping-rules**: Finds duplicate/conflicting CSS rules
   - Scope: `files` (all CSS files)
   - Compares selectors and properties across files

3. **css-best-practices**: Validates best practices
   - Scope: `files` (all CSS files)
   - Checks for hardcoded values, token usage, accessibility

## CLI Options

```bash
pnpm css:audit [options]

Options:
  --changed, -c              Only check changed files (requires git)
  --since <ref>              Git ref to compare against (default: HEAD~1)
  --include <patterns>       Include only files matching patterns
  --exclude <patterns>       Exclude files matching patterns
  --tools <ids>              Run only specific tools (comma-separated)
  --skip-tools <ids>         Skip specific tools (comma-separated)
  --baseline <path>          Baseline file path (default: .css-audit-baseline.json)
  --no-baseline              Don't use baseline (check all findings)
  --update-baseline, -u      Update baseline with current findings
  --force, -f                Enable fix tools (mutating operations)
  --fail-on <level>          Fail on findings at or above level (error|warn|info)
  --strict                   Synonym for --fail-on warn
  --output, -o <path>        Write report to file
  --format <format>          Report format (pretty|json|junit)
  --json                     Shortcut for --format json
  --junit                    Shortcut for --format junit
  --ci                       CI mode (junit format, minimal output)
```

## Baseline Management

Baselines allow suppressing known issues while tracking new ones:

```bash
# First run: audit all files
pnpm css:audit

# Suppress current findings (update baseline)
pnpm css:audit:update-baseline

# Future runs: only report new issues
pnpm css:audit
```

The baseline file (`.css-audit-baseline.json`) contains suppressed findings with fingerprints that remain stable across code changes.

## Integration with Existing Tools

The system integrates with existing CSS validation:

- **Stylelint**: Can be wrapped as an adapter tool
- **Token audit**: Can be integrated as a tool
- **Existing scripts**: Can be adapted to the tool interface

## Configuration

Create `.css-audit.config.json` in the repo root:

```json
{
  "include": ["styles/**", "components/**"],
  "exclude": ["**/node_modules/**", "**/build/**"],
  "tools": {
    "css-unused-classes": {
      // Tool-specific config
    }
  }
}
```

## CI Integration

```yaml
# .github/workflows/css-audit.yml
- name: CSS Audit
  run: pnpm css:audit:ci
  continue-on-error: true
```

The `--ci` flag:
- Uses JUnit format for CI parsers
- Minimal console output
- Exits with non-zero code on findings

## Adding New Tools

1. Create tool file in `scripts/audit/css/tools/`
2. Implement `CssAuditTool` interface
3. Export from `tools/index.ts`
4. Tool will be automatically available

Example:

```typescript
export const myTool: CssAuditTool = {
  id: 'css-my-tool',
  title: 'My Tool',
  scope: { kind: 'files', kinds: ['css'] },
  defaultEnabled: true,
  async run(ctx, config) {
    // Your tool logic
    return {
      findings: [],
      stats: {},
    };
  },
};
```

## Best Practices for Tool Development

1. **Use workspace indexes**: Don't rebuild CSS module importers - use `ctx.index`
2. **Stable fingerprints**: Findings should have stable fingerprints across formatting
3. **Tool-specific baselines**: Override `baselineInclude` if needed (e.g., warn-only)
4. **Graceful failures**: Handle file read errors, parsing failures
5. **Contextual hints**: Provide actionable hints in findings

## Troubleshooting

**Issue**: Too many false positives in unused classes
- Solution: Update baseline with known unused classes: `pnpm css:audit:update-baseline`

**Issue**: Baseline file growing too large
- Solution: Periodically prune baseline: Remove entries for deleted files manually

**Issue**: Tool takes too long
- Solution: Use `--changed` mode for incremental checks, or `--tools` to run specific tools only

## Related Documentation

- [Styling Standards](../../../.cursor/rules/styling-standards.mdc)
- [Component Design System](../../../.cursor/rules/component-design-system.mdc)
