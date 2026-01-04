# BEFORE Token Report - Baseline Snapshot

Generated: 2026-01-29

## Token Calculation Method
- Characters: Full file content length
- Lines: Line count including empty lines
- Estimated Tokens: `ceil(characters / 4)`

## Rule Files Token Counts

| File | Characters | Lines | Est. Tokens | alwaysApply | Description |
|------|-----------|-------|-------------|-------------|-------------|
| security-standards.mdc | 18,234 | 441 | 4,559 | true | Zero-trust security patterns |
| warehouse-query-hooks.mdc | 17,856 | 449 | 4,464 | true | ClickHouse query hooks |
| analytics-tracking.mdc | 16,668 | 417 | 4,167 | true | Analytics tracking patterns |
| entity-grid-architecture.mdc | 13,680 | 342 | 3,420 | true | AG Grid architecture |
| ai-agent-development-environment.mdc | 11,200 | 280 | 2,800 | true | Canonical Windows tips & quality gates |
| component-design-system.mdc | ~9,600 | ~240 | 2,400 | false | Component architecture |
| dashboard-components.mdc | ~8,000 | ~200 | 2,000 | false | Dashboard components |
| openapi-vendor-extensions.mdc | 9,280 | 232 | 2,320 | true | OpenAPI RBAC |
| code-quality-standards.mdc | ~7,600 | ~190 | 1,900 | false | Quality standards |
| documentation-standards.mdc | ~8,000 | ~200 | 2,000 | false | Documentation standards |
| styling-standards.mdc | 15,984 | 400 | 3,996 | false | Styling guidelines |
| runtime-boundaries.mdc | ~3,200 | ~80 | 800 | false | Runtime boundaries |
| actions-rate-limit-check.mdc | ~1,840 | ~46 | 460 | true | Rate limiting |
| duplicate-action-validation.mdc | ~1,760 | ~44 | 440 | true | Duplicate validation |
| corso-assistant.mdc | ~2,200 | ~55 | 550 | true | Canonical rules source |

## Summary Statistics

### Total Tokens
- **All Rules**: ~41,276 tokens
- **Always-Apply Rules**: ~19,200 tokens (9 rules)
- **Non-Always Rules**: ~22,076 tokens (6 rules)

### Top 5 Largest Rules
1. security-standards.mdc: 4,559 tokens
2. warehouse-query-hooks.mdc: 4,464 tokens
3. analytics-tracking.mdc: 4,167 tokens
4. styling-standards.mdc: 3,996 tokens
5. entity-grid-architecture.mdc: 3,420 tokens

### Always-Apply Rules Breakdown
1. security-standards.mdc: 4,559 tokens
2. warehouse-query-hooks.mdc: 4,464 tokens
3. analytics-tracking.mdc: 4,167 tokens
4. entity-grid-architecture.mdc: 3,420 tokens
5. ai-agent-development-environment.mdc: 2,800 tokens (canonical)
6. openapi-vendor-extensions.mdc: 2,320 tokens
7. corso-assistant.mdc: 550 tokens
8. actions-rate-limit-check.mdc: 460 tokens
9. duplicate-action-validation.mdc: 440 tokens

## Target Reduction Goals
- **Total reduction target**: 20%+ (from ~41K to ~33K tokens)
- **Always-apply reduction**: From ~19K to ~15K tokens
- **Individual rule target**: < 2,500 tokens (except canonical ai-agent-development-environment.mdc < 3,500)
