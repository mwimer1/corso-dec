# Documentation Automation Enhancement

## Summary

Enhanced documentation maintenance automation with new validation scripts and TOC generation.

## New Scripts

### 1. `validate-docs-content.ts`

**Purpose**: Validates documentation content for banned patterns, code block issues, and environment variable documentation completeness.

**Features**:
- Scans markdown files for banned patterns (e.g., direct `process.env` usage)
- Validates TypeScript/JavaScript code blocks for common issues
- Checks environment variable documentation completeness
- Extracts env vars from `lib/server/env.ts` and compares with documentation

**Usage**:
```bash
pnpm docs:validate:content
```

**Integration**: Automatically runs as part of `pnpm docs:validate`

### 2. `generate-env-docs-toc.ts`

**Purpose**: Generates or updates Table of Contents for environment variables documentation.

**Features**:
- Extracts environment variables from `lib/server/env.ts`
- Categorizes variables (public, server, build, integration, feature)
- Generates markdown TOC with links
- Updates existing TOC or creates new one

**Usage**:
```bash
pnpm docs:env:toc
```

## Package.json Scripts

Added new scripts:
- `docs:validate:content` - Run content validation only
- `docs:env:toc` - Generate/update env var TOC

Updated:
- `docs:validate` - Now includes content validation

## Integration Points

### CI/CD
- Content validation runs as part of `docs:validate` in CI
- Can be run independently for faster feedback

### Pre-commit
- Lightweight validation via `validate-docs-on-commit.ts` (unchanged)
- Full validation available via `docs:validate`

## Testing

Test file: `scripts/maintenance/__tests__/validate-docs-content.test.ts`

Run tests:
```bash
pnpm test scripts/maintenance/__tests__/validate-docs-content.test.ts
```

## Documentation

See `docs/tools-scripts/docs-automation.md` for complete documentation.

## Future Enhancements

Potential improvements (backlog):
- Parse code blocks and verify they compile
- Check code snippets match actual codebase patterns
- Validate API endpoint documentation matches OpenAPI spec
- Auto-generate API endpoint documentation from code
- Validate example code in documentation

## Verification

To verify the scripts work:

1. **Test content validation**:
   ```bash
   # Should pass
   pnpm docs:validate:content
   
   # Create test violation
   echo "const key = process.env.API_KEY;" > test-doc.md
   pnpm docs:validate:content
   # Should fail
   rm test-doc.md
   ```

2. **Test TOC generation**:
   ```bash
   pnpm docs:env:toc
   git diff docs/references/env.md
   # Should show TOC updates
   ```

3. **Test integration**:
   ```bash
   pnpm docs:validate
   # Should run all validations including content
   ```


