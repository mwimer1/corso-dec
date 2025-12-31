# Development Tools

Standalone CLI tools for development and maintenance tasks.

## Tools

### `scan-directory.ts`

Generates a clean, tree-like directory structure for analysis.

**Usage:**
```bash
pnpm tools:scan-dir [directory] [options]
```

**Examples:**
```bash
# Scan scripts directory
pnpm tools:scan-dir scripts

# Scan with depth limit
pnpm tools:scan-dir components --max-depth 3

# Scan with exclusions
pnpm tools:scan-dir . --exclude node_modules,dist,.next

# Use compact format
pnpm tools:scan-dir . --compact

# Show statistics only
pnpm tools:scan-dir . --stats
```

**Options:**
- `--max-depth <number>` - Maximum depth to scan (default: 10)
- `--exclude <patterns>` - Comma-separated patterns to exclude
- `--no-files` - Exclude files from output
- `--no-dirs` - Exclude directories from output
- `--compact` - Use compact format instead of tree
- `--stats` - Show statistics only
- `--json` - Emit machine-readable JSON
- `--no-emoji` - Disable emojis in output labels

**When to use:**
- Generating directory structure documentation
- Analyzing project structure
- Finding files/directories at specific depths

### `list-drop-candidates.ts`

Lists files from orphan report that are actionable for deletion.

**Usage:**
```bash
pnpm tools:list-drop-candidates
```

**Prerequisites:**
- Run `pnpm audit:orphans` first to generate the orphan report

**Output:**
- **REVIEW**: Files that need manual triage (only referenced in docs/tests)
- **DROP**: Files safe to delete (no references)

**When to use:**
- After running orphan audit to identify deletable files
- Before cleaning up unused files
- Reviewing file usage patterns

### `tools-doctor.mjs`

Checks if required CLI tools are installed and at correct versions.

**Usage:**
```bash
pnpm tools:doctor
```

**Checks:**
- `sg` (ast-grep) - version >= 0.38.x
- `rg` (ripgrep)
- `fd`
- `gh` (GitHub CLI)

**When to use:**
- Setting up development environment
- Verifying tool installation
- CI/CD environment validation

## Adding New Tools

When adding new tools to this directory:

1. **Make it executable**: Add shebang (`#!/usr/bin/env tsx` or `#!/usr/bin/env node`)
2. **Add to package.json**: Create a `tools:*` script for discoverability
3. **Document it**: Add entry to this README with usage examples
4. **Keep it standalone**: Tools here should not be imported by other scripts (use `scripts/utils/` for that)
