# Archived Maintenance Scripts

This directory contains scripts that are no longer actively used but are preserved for historical reference or potential future use.

## Scripts

### `autofix-doc-links.js`
**Status**: Archived - Replaced by `fix-links.ts`  
**Date Archived**: 2025-01-XX  
**Reason**: Legacy CommonJS script using heuristic basename-based link fixing. The modern `fix-links.ts` uses a configuration-driven, pattern-based approach which is safer and more maintainable.

**Original Purpose**: Heuristic auto-discovery of broken markdown links by finding files with matching basenames. Could potentially catch unknown broken links, but less predictable than pattern-based fixes.

**Replacement**: `scripts/maintenance/fix-links.ts` (uses `link-fixes.config.ts` for pattern-based fixes)

---

### `replace-package-script-references.ts`
**Status**: Archived - One-time migration codemod (completed)  
**Date Archived**: 2025-01-XX  
**Reason**: One-time script migration codemod. Migration completed - all package.json script references have been updated to new naming convention.

**Original Purpose**: Renamed package.json script references across the codebase (e.g., `ui:scan` → `scan:ui`).

**Note**: This script can be safely deleted after a few releases if no longer needed for reference.

---

## Cleanup Policy

Scripts in this directory:
- Are not actively maintained
- May be deleted after 3-6 months if no longer needed
- Should not be used in CI/CD or automated workflows
- Are preserved only for historical reference or potential one-off use cases
