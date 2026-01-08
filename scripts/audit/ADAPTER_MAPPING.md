# CSS Audit Tool Adapters - Output to Finding Mapping

This document explains how each adapter converts its underlying script output into standardized `Finding` objects.

## Adapter Pattern

All adapters follow this pattern:
1. Run the underlying script logic (imported or re-implemented)
2. Extract findings from script output
3. Convert to `Finding` objects with stable fingerprints
4. Return `ToolRunResult` with findings and stats

## Tool Adapters

### 1. `stylelint` → `tools/stylelint.ts`

**Source Script**: Runs stylelint via child_process  
**Output Format**: JSON from stylelint `--formatter json`  
**Mapping**:
- `fileResult.source` → `Finding.file`
- `warning.line` → `Finding.line`
- `warning.column` → `Finding.col`
- `warning.rule` → `Finding.ruleId` (prefixed with `stylelint/`)
- `warning.text` → `Finding.message`
- `warning.severity` → `Finding.severity` ('error' or 'warn')

**Fingerprint**: `stylelint:${ruleId}:${file}:${messageHash}`
- **Stable**: ✅ Does NOT include line/col
- **Message hash**: Base64 encoding of first 16 chars of message text

### 2. `css-duplicate-styles` → `tools/duplicate-styles.ts`

**Source Script**: `scripts/lint/check-duplicate-styles.ts`  
**Output Format**: LintResult with error messages  
**Mapping**:
- Re-implements core logic directly (no exec)
- Each duplicate pair → one `Finding`
- Pattern file path → `Finding.file`
- Error message → `Finding.message`

**Fingerprint**: `css-duplicate-styles:${patternName}:${componentFiles.join(',')}`
- **Stable**: ✅ Based on component names, not file paths

**Example**:
```
Pattern: styles/ui/patterns/button.css
Components: components/ui/button.module.css
→ Finding with pattern file and component files in data
```

### 3. `css-paths` → `tools/css-paths.ts`

**Source Script**: `scripts/lint/check-css-paths.ts`  
**Output Format**: List of files from ripgrep  
**Mapping**:
- Each stray CSS file → one `Finding`
- File path → `Finding.file`
- Generic message → `Finding.message`

**Fingerprint**: `css-paths:${file}`
- **Stable**: ✅ Based on file path only

**Example**:
```
File: components/widgets/custom.css
→ Finding with error severity
```

### 4. `css-unused-tokens` → `tools/unused-tokens.ts`

**Source Script**: `scripts/maintenance/audit-unused-tokens.ts`  
**Output Format**: JSON `{ unusedTokens: string[] }`  
**Mapping**:
- Re-implements core logic directly
- Each unused token → one `Finding`
- Token definition location → `Finding.file` and `Finding.line`
- Token name → `Finding.data.token`

**Fingerprint**: `css-unused-tokens:${token}`
- **Stable**: ✅ Based on token name only (not location)

**Note**: Tokens in `styles/tokens/UNUSED.allowlist.json` are excluded (already handled by script logic)

### 5. `css-size` → `tools/css-size.ts`

**Source Script**: `scripts/lint/css-size-analyzer.ts`  
**Output Format**: Console text + file size check  
**Mapping**:
- Re-implements size check directly
- Size > 150KB → one `Finding` with error severity
- Size info → `Finding.data` (sizeKB, maxKB, exceededBy)
- CSS file path → `Artifact` in `ToolRunResult.artifacts`

**Fingerprint**: `css-size:exceeded:${sizeKB.toFixed(2)}`
- **Stable**: ✅ Based on size value (changes only when size changes meaningfully)

**Scope**: Global (always runs, not affected by `--changed`)

### 6. `css-validate-styles` → `tools/validate-styles.ts`

**Source Script**: `scripts/ci/validate-styles.ts`  
**Output Format**: Violations array  
**Mapping**:
- Re-implements validation logic directly
- Each violation → one `Finding`
- Violation type → `Finding.ruleId`:
  - `css/inline-style-color`
  - `css/inline-style-spacing`
  - `css/hardcoded-color`
  - `css/hardcoded-spacing`
- File and line from violation → `Finding.file` and `Finding.line`

**Fingerprints**:
- `css-validate-styles:inline-color:${file}:${line}`
- `css-validate-styles:inline-spacing:${file}:${line}`
- `css-validate-styles:hardcoded-hex:${file}:${line}`
- etc.

**Stable**: ✅ Includes line number (intentional - same violation at same location is same finding)

### 7. `css-purge-styles` → `tools/purge-styles.ts` (Fix Tool)

**Source Script**: `scripts/analysis/purge-styles.ts`  
**Output Format**: List of files to delete  
**Mapping**:
- Currently placeholder (full implementation would analyze barrel files)
- Each file to purge → one `Finding` (info level)
- File path → `Finding.file`

**Fingerprint**: `css-purge-styles:${file}`  
**Category**: `fix` (mutating)  
**Default**: Disabled (requires `--force` or explicit `--tools css-purge-styles`)

## Common Patterns

### Fingerprint Stability

All fingerprints are designed to be stable across:
- Code reformatting (no line/col in fingerprint)
- File moves (file path is normalized)
- Temporary changes (based on content, not timestamps)

Exception: `css-validate-styles` intentionally includes line numbers since violations at different lines are different issues.

### Severity Mapping

- **Error**: Critical issues that should be fixed (size limits, file organization)
- **Warn**: Issues that should be addressed but aren't blocking (unused tokens, duplicate styles)
- **Info**: Informational findings (rarely used in audit tools)

### Baseline Inclusion

Each tool can override `baselineInclude()` to control what gets baselined:
- Default: All findings with `severity !== 'info'`
- `css-unused-tokens`: Only warn-level (many tokens are Tailwind-integrated)
- `stylelint`: All error and warn findings

## Testing Adapters

To test an adapter in isolation:

```bash
# Run specific tool only
pnpm audit:css --tools css-unused-tokens

# Skip baseline to see all findings
pnpm audit:css --no-baseline --tools css-unused-tokens
```

## Adding New Adapters

1. Create tool file in `scripts/audit/tools/`
2. Implement `CssAuditTool` interface
3. Export from `tools/index.ts` (add to `allTools` if audit category)
4. Tool will be automatically available

See existing adapters for examples of different output parsing strategies.
