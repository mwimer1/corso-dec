---
status: "draft"
last_updated: "2026-01-09"
category: "documentation"
---
# Documentation Tracking & Action Items

Last updated: 2026-01-07

This document tracks documentation completeness, identifies placeholders, and lists remaining action items for the Corso documentation system.

## ✅ Completed Actions

### README Standardization (2026-01-07)
- ✅ Fixed policy violation: Removed single-file README from `baseline/` directory
- ✅ Enhanced 4 placeholder READMEs with proper content:
  - `docs/decisions/README.md`
  - `docs/security/README.md`
  - `docs/feature-notes/README.md`
  - `docs/maintenance/powershell-performance-fixes/README.md`
- ✅ Created 4 missing READMEs for directories with 2+ files:
  - `docs/analytics/README.md`
  - `docs/database/README.md`
  - `docs/ai/README.md`
  - `docs/typescript/README.md`
- ✅ Updated documentation standards with README requirements
- ✅ Updated main `docs/README.md` with all new sections

## 🔴 Remaining Action Items

### Priority 1: Placeholder References

#### 1. Fix "Coming Soon" Reference in Main README
- **File**: `docs/README.md` (line 230)
- **Issue**: References `docs/CONTRIBUTING-DOCS.md` as "coming soon" but file actually exists
- **Action**: Remove "(coming soon)" text from the reference
- **Status**: 🔴 Not Started
- **Estimated Effort**: 1 minute

### Priority 2: Documentation Completeness Review

#### 2. Review Single-File Directories
The following directories have only one file and correctly do NOT have READMEs (per policy):
- ✅ `docs/adr/` - 1 file (001-chat-history-persistence.md) - No README needed
- ✅ `docs/accessibility/` - 1 file (accessibility-guide.md) - No README needed
- ✅ `docs/error-handling/` - 1 file (error-handling-guide.md) - No README needed
- ✅ `docs/monitoring/` - 1 file (monitoring-guide.md) - No README needed
- ✅ `docs/operations/` - 1 file (operational-guide.md) - No README needed
- ✅ `docs/performance/` - 1 file (performance-optimization-guide.md) - No README needed
- ✅ `docs/production/` - 1 file (production-readiness-checklist.md) - No README needed
- ✅ `docs/ui/` - 1 file (table.md) - No README needed
- ✅ `docs/api/` - 1 file (api-design-guide.md) - No README needed
- ✅ `docs/content/` - 1 file (insights-authoring-guide.md) - No README needed

**Status**: ✅ All correctly configured (no action needed)

#### 3. Review Data-Only Directories
- ✅ `docs/maintenance/unused-exports/` - Contains only `baseline.json` (data file, not documentation) - No README needed
- ✅ `docs/codebase/_generated/` - Contains generated files - No README needed

**Status**: ✅ All correctly configured (no action needed)

### Priority 3: Future Enhancements (Optional)

#### 4. Consider READMEs for Growing Directories
If any single-file directories grow to 2+ files in the future, add READMEs following the template in `.cursor/rules/documentation-standards.mdc`.

**Current Status**: No directories need this yet.

#### 5. Documentation Freshness Audit
- **Action**: Review `last_updated` dates in frontmatter
- **Frequency**: Quarterly (next due: 2026-04-07)
- **Status**: 📅 Scheduled

## 📊 Documentation Completeness Status

### README Coverage
- **Total READMEs**: 30
- **Directories with 2+ files**: 14
- **Directories with READMEs**: 14 ✅ (100% coverage)
- **Placeholder READMEs**: 0 ✅
- **Policy Violations**: 0 ✅

### Directory Status
- **Directories with proper READMEs**: 14 ✅
- **Single-file directories (no README needed)**: 10 ✅
- **Data-only directories (no README needed)**: 2 ✅
- **Total directories**: 26 ✅

## 🔍 Placeholder Detection

### How to Identify Placeholders
1. **Generic descriptions**: Look for "Documentation and resources for documentation functionality" without specific content
2. **"Coming soon" references**: Check for references to files that don't exist or are marked as "coming soon"
3. **Empty sections**: READMEs with only frontmatter and no actual content
4. **TODO/FIXME markers**: Any documentation with TODO or FIXME comments

### Current Placeholder Status
- ✅ **No placeholder READMEs found** (all have proper content)
- 🔴 **1 placeholder reference found** (see Priority 1, Item 1)

## 📝 Maintenance Guidelines

### When to Update This Document
- After completing any action item
- When new documentation directories are created
- When single-file directories grow to 2+ files
- Quarterly during documentation audits

### Review Checklist
- [ ] All action items completed or updated
- [ ] No new placeholder READMEs created
- [ ] All READMEs have proper frontmatter
- [ ] All READMEs link back to parent index
- [ ] Main `docs/README.md` is up-to-date
- [ ] No "coming soon" or placeholder references

## 🔗 Related Documentation

- [Documentation Standards](../.cursor/rules/documentation-standards.mdc) - README requirements and templates
- [Contributing to Documentation](CONTRIBUTING-DOCS.md) - Documentation contribution guidelines
- [Documentation Index](README.md) - Main documentation index

---

**Last Updated**: 2026-01-07  
**Next Review**: 2026-04-07 (Quarterly)  
**Maintained By**: Platform Team  
**Status**: Active
