# Pre-Audit Q&A: Cursor Rules System Deep Research

## Context & Scope Clarifications

### Q1: What is the current date for freshness calculations?
**A:** Use **December 15, 2025** as the current date. The `_index.json` shows `generatedAt: "2025-12-15T00:55:22.021Z"`, and all rules show `last_reviewed: "2025-10-13"`, meaning they are **63 days old** (stale threshold is 90 days, so they're approaching stale status).

### Q2: How many rules should I expect to audit?
**A:** Expect exactly **13 rule files** (`.mdc` files) plus supporting files:
- Core rules: 13 files listed in `_index.json`
- Supporting: `README.md`, `_snippets.mdc`, `_index.json`, `corso-dev.md` (auto-generated)
- Templates: `templates/rule-templates.mdc` (not a rule, but should be reviewed)

### Q3: What validation scripts exist and what do they check?
**A:** Key validation scripts include:
- **`pnpm validate:cursor-rules`** → Runs `scripts/ci/validate-cursor-rules.ts`
  - Validates frontmatter schema (rule_id, title, owners, status, domains, enforcement, alwaysApply, globs, related_rules, last_reviewed)
  - Checks for duplicate rule_id values
  - Verifies related_rules references exist
  - Ensures `alwaysApply=true` rules have non-empty `globs[]`
- **`pnpm rules:sync`** → Runs index generation and then validation (likely invokes the above script plus index refresh)
- **`pnpm validate:cursor-rules:perf`** → Probably runs performance monitoring on rules (less critical for content accuracy)

**What they DON'T check** (your audit should):
- Code example accuracy or correctness
- Import path validity (whether referenced files/exports exist)
- Command functionality or presence (beyond just existence in package scripts)
- Enforcement mechanism actual implementation (just presence, not correctness)
- Cross-rule consistency of content
- Content freshness (timeliness of guidance)

### Q4: Should I actually execute commands or just verify they exist?
**A:** **Verify existence only** – do not execute commands. For each command mentioned in the rules:
1. Check if the script exists in `package.json` under "scripts".
2. Verify the referenced file or path exists in the repository (e.g. a script file or config file).
3. Check Windows compatibility (no Unix-only commands or syntax).
4. Note if a command is documented in rules but missing from the codebase or package.json.

(Exception: You may run something like `pnpm validate:cursor-rules` locally just to see what it does, but avoid running any destructive or lengthy processes. Focus on existence and configuration.)

### Q5: How do I verify enforcement mechanisms?
**A:** For each rule that claims an enforcement mechanism:

**ESLint Rules:**
- Check the **`eslint-plugin-corso/`** directory (at repo root, not in `tools/`) for rule files matching the rule name or description.
- Verify it's exported in the plugin's index (likely `index.js` or `index.ts` in that directory).
- Ensure the rule's implementation corresponds to what the cursor rule describes.

**ast-grep Patterns:**
- Look for ast-grep configuration directory: **`scripts/rules/ast-grep/`** (not `.astgrep/` or `tools/ast-grep/`).
- Identify YAML pattern files that correspond to the rule (maybe named similarly).
- Ensure the pattern syntax is valid YAML and targets what the rule describes.

**CI Validation:**
- Check `.github/workflows/` for any workflow running these validations (for example, a `validate-cursor-rules.yml`).
- Ensure that `pnpm validate:cursor-rules` (and any other relevant checks, like ESLint or ast-grep) are included in CI pipelines so rules are automatically enforced.

### Q6-Q20: [Remaining Q&A content - see original document for full text]

## Quick Reference: Key Files & Paths (CORRECTED)

**Rules Directory:** `.cursor/rules/` ✅  
**Validation Script:** `scripts/ci/validate-cursor-rules.ts` ✅  
**Index File:** `.cursor/rules/_index.json` ✅  
**Snippets:** `.cursor/rules/_snippets.mdc` ✅  
**Templates:** `.cursor/rules/templates/rule-templates.mdc` ✅  
**Package Scripts:** `package.json` (lines 275-292) ✅  
**CI Workflow:** `.github/workflows/validate-cursor-rules.yml` ✅  

**ESLint Plugin:** `eslint-plugin-corso/` (root level, **NOT** `tools/eslint-plugin-corso/`) 🔧  
**ast-grep Rules:** `scripts/rules/ast-grep/` (**NOT** `.astgrep/` or `tools/ast-grep/`) 🔧

