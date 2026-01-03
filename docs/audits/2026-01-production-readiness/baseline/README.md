---
status: "active"
last_updated: "2026-01-03"
category: "documentation"
---
# Baseline Capture Instructions

**Purpose**: Capture a "before" snapshot of all quality gates and validation commands before starting remediation work. This provides a measurable baseline for tracking progress and ensures we don't fix issues that don't exist.

## Prerequisites

1. **Ensure you're on the `main` branch**:
   ```bash
   git switch main
   git pull --ff-only
   ```

2. **Verify environment is set up**:
   ```bash
   pnpm install
   pnpm validate:env
   ```

## Capture Process

Run each command sequentially (one-by-one) and save the output to the corresponding file in this directory.

### Windows PowerShell Commands

```powershell
# Navigate to repository root
cd c:\Users\wimer\OneDrive\Desktop\corso-code

# Create baseline directory (if not exists)
New-Item -ItemType Directory -Force -Path docs\audits\2026-01-production-readiness\baseline

# Run each command and capture output
pnpm quality:local | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\quality-local.txt
pnpm openapi:rbac:check | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\openapi-rbac.txt
pnpm validate:cursor-rules | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\cursor-rules.txt
pnpm madge:ci | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\madge.txt
pnpm jscpd:ci | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\jscpd.txt
pnpm verify:edge | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\verify-edge.txt
pnpm lint:edge-runtime | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\lint-edge-runtime.txt
pnpm validate:boundaries:deep | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\boundaries-deep.txt
pnpm validate:zod:strict | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\zod-strict.txt
pnpm test:coverage | Tee-Object -FilePath docs\audits\2026-01-production-readiness\baseline\test-coverage.txt
```

### Alternative: Git Bash / WSL Commands

If using Git Bash or WSL, you can use the Unix-style `|& tee` syntax:

```bash
# Navigate to repository root
cd /c/Users/wimer/OneDrive/Desktop/corso-code

# Run each command and capture output
pnpm quality:local |& tee docs/audits/2026-01-production-readiness/baseline/quality-local.txt
pnpm openapi:rbac:check |& tee docs/audits/2026-01-production-readiness/baseline/openapi-rbac.txt
pnpm validate:cursor-rules |& tee docs/audits/2026-01-production-readiness/baseline/cursor-rules.txt
pnpm madge:ci |& tee docs/audits/2026-01-production-readiness/baseline/madge.txt
pnpm jscpd:ci |& tee docs/audits/2026-01-production-readiness/baseline/jscpd.txt
pnpm verify:edge |& tee docs/audits/2026-01-production-readiness/baseline/verify-edge.txt
pnpm lint:edge-runtime |& tee docs/audits/2026-01-production-readiness/baseline/lint-edge-runtime.txt
pnpm validate:boundaries:deep |& tee docs/audits/2026-01-production-readiness/baseline/boundaries-deep.txt
pnpm validate:zod:strict |& tee docs/audits/2026-01-production-readiness/baseline/zod-strict.txt
pnpm test:coverage |& tee docs/audits/2026-01-production-readiness/baseline/test-coverage.txt
```

## Expected Output Files

After running all commands, you should have the following files in this directory:

- `quality-local.txt` - Full quality gates output
- `openapi-rbac.txt` - OpenAPI RBAC validation results
- `cursor-rules.txt` - Cursor rules validation results
- `madge.txt` - Circular dependency analysis
- `jscpd.txt` - Code duplication analysis
- `verify-edge.txt` - Edge runtime safety verification
- `lint-edge-runtime.txt` - Edge runtime linting results
- `boundaries-deep.txt` - Deep boundary validation results
- `zod-strict.txt` - Strict Zod validation audit
- `test-coverage.txt` - Test coverage report

## Important Notes

1. **Run commands sequentially**: Don't chain commands with `&&` - run each one separately to capture individual failures.

2. **Don't suppress output**: Avoid using `pnpm -s` or `--silent` flags - we need to see all warnings and errors.

3. **Capture everything**: The `Tee-Object` (PowerShell) or `tee` (Bash) commands will both display output and save it to the file.

4. **If a command fails**: Still save the output - failures are important baseline information.

5. **Git status**: After capturing baseline, note your git status:
   ```bash
   git --no-pager status
   git --no-pager log --oneline -1
   ```

## Verification

After capturing all baselines, verify the files exist:

```powershell
# PowerShell
Get-ChildItem docs\audits\2026-01-production-readiness\baseline\*.txt | Select-Object Name, Length, LastWriteTime
```

```bash
# Bash
ls -lh docs/audits/2026-01-production-readiness/baseline/*.txt
```

## Next Steps

Once baseline is captured:

1. Review the outputs to identify existing issues
2. Update the [Remediation Tracker](../remediation-tracker.md) with findings
3. Begin remediation work starting with Critical priority items

## Related Documentation

- [Remediation Tracker](../remediation-tracker.md) - Track remediation progress
- [Quality Gates Baseline](../../cicd-workflow/quality-gates-baseline.md) - Previous quality gates documentation
- [Production Readiness Checklist](../../production/production-readiness-checklist.md) - Production readiness checklist

---

**Baseline Capture Date**: _[Fill in after capture]_  
**Branch**: `main`  
**Commit**: _[Fill in after capture: `git --no-pager log --oneline -1`]_
