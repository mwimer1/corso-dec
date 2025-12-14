---
title: Dependencies
description: >-
  Documentation and resources for documentation functionality. Located in
  dependencies/.
last_updated: '2025-12-14'
category: documentation
status: draft
---
# Dependency Management Guide

> **Complete guide to managing dependencies, handling vulnerabilities, and maintaining a secure, up-to-date dependency tree**

## 📋 Quick Reference

**Key Commands:**
```bash
# Check for vulnerabilities
pnpm audit --audit-level=high

# Check for outdated packages
pnpm outdated

# Update dependencies
pnpm deps:update

# Check unused dependencies
pnpm deps:unused

# Validate dependency health
pnpm validate:dependencies
```

## 🎯 Dependency Management Strategy

### Core Principles

1. **Zero High/Critical Vulnerabilities**: All high-severity issues must be resolved immediately
2. **Regular Updates**: Weekly dependency reviews via Dependabot
3. **Version Alignment**: Keep related packages on compatible versions
4. **Minimal Overrides**: Use `pnpm.overrides` only when necessary
5. **Security First**: Prioritize security updates over feature updates

### Update Strategy

**Priority Order:**
1. **Security Patches**: Immediate (high/critical vulnerabilities)
2. **Patch Updates**: Weekly (via Dependabot)
3. **Minor Updates**: Monthly review
4. **Major Updates**: Quarterly review with testing

## 🔒 Vulnerability Management

### Current Vulnerabilities

**Active Vulnerabilities:**
- Check current status: `pnpm audit --audit-level=moderate`

**Resolution Process:**
1. **Identify**: Run `pnpm audit --audit-level=high`
2. **Assess**: Review vulnerability details and affected packages
3. **Update**: Update parent package or use override
4. **Verify**: Run tests and type checking
5. **Document**: Update dependency policy if override used

### Vulnerability Resolution Methods

#### Method 1: Update Parent Package (Preferred)
```bash
# Update the package that depends on vulnerable dependency
pnpm update markdownlint-cli

# Verify fix
pnpm audit --audit-level=high
```

#### Method 2: Use pnpm Overrides (Temporary)
```json
{
  "pnpm": {
    "overrides": {
      "glob": ">=11.1.0"
    }
  }
}
```

**Guidelines:**
- Only use when parent package hasn't updated
- Document in dependency policy
- Remove once parent updates
- Keep within same major version when possible

### Current Overrides

**Security Overrides:**
- `ws >= 8.17.1` — DoS fix
- `tar-fs >= 3.0.9` — path traversal fixes
- `npm-run-path = 5.3.0` — exact pin for bin deduplication
- `unicorn-magic = 0.1.0` — exact pin for bin deduplication
- `@typescript-eslint/utils>eslint = 9.34.0` — exact pin for bin deduplication
- `cross-spawn-async = npm:cross-spawn@7.0.3` — exact alias for bin deduplication
- `json-schema-ref-parser = npm:@apidevtools/json-schema-ref-parser@^11.7.2` — exact pin
- `@faker-js/faker = npm:@faker-js/faker@^9.2.0` — exact pin
- `sourcemap-codec = npm:@jridgewell/sourcemap-codec@^1.5.5` — exact pin
- `deep-extend = npm:@simov/deep-extend@^1.0.0` — exact pin

**See [Dependency Policy](../security/dependency-policy.md) for complete list**

## 📦 Dependency Categories

### Production Dependencies

**Core Framework:**
- `next@^15.5.9` - Next.js framework
- `react@18.3.1` - React library
- `react-dom@18.3.1` - React DOM

**Authentication & Security:**
- `@clerk/nextjs@^6.36.2` - Authentication
- `@sentry/nextjs@^9.47.1` - Error tracking
- `svix@^1.82.0` - Webhook verification

**Data & Storage:**
- `@clickhouse/client@^1.14.0` - ClickHouse client
- `@tanstack/react-query@^4.42.0` - Data fetching
- `@upstash/redis@^1.35.8` - Redis client

**UI Components:**
- `@radix-ui/*` - UI primitives
- `@mui/material@^6.5.0` - Material UI
- `ag-grid-*` - Data grid components

### Development Dependencies

**Type Checking:**
- `typescript@~5.9.3` - TypeScript compiler
- `@typescript-eslint/*` - TypeScript ESLint rules

**Testing:**
- `vitest@^3.2.4` - Test framework
- `@testing-library/*` - Testing utilities

**Linting & Formatting:**
- `eslint@^9.39.1` - ESLint
- `stylelint@16.24.0` - CSS linting
- `@corso/eslint-plugin` - Custom ESLint rules

**Build Tools:**
- `esbuild@^0.25.12` - Fast bundler
- `tsx@^4.21.0` - TypeScript execution

## 🔄 Update Workflow

### Automated Updates (Dependabot)

**Configuration:** `.github/dependabot.yml`

**Update Groups:**
- **Development Dependencies**: Weekly (Tuesdays 10:00 AM ET)
- **Production Dependencies**: Weekly (Tuesdays 10:00 AM ET)
- **Security Dependencies**: Prioritized updates
- **GitHub Actions**: Weekly (Mondays 9:00 AM ET)

**Review Process:**
1. Dependabot creates PR with updates
2. CI runs full test suite
3. Review changes and test locally
4. Merge if all checks pass

### Manual Updates

**Patch Updates:**
```bash
# Check what can be updated
pnpm deps:outdated

# Interactive update (patch only)
pnpm deps:update
```

**Minor Updates:**
```bash
# Check minor updates
pnpm deps:outdated:major

# Interactive update (minor)
pnpm deps:update:minor
```

**Major Updates:**
- Requires manual review
- Test thoroughly
- Check breaking changes
- Update code if needed

### Update Checklist

Before updating:
- [ ] Review changelog for breaking changes
- [ ] Check compatibility with other dependencies
- [ ] Review security advisories
- [ ] Test locally after update

After updating:
- [ ] Run `pnpm typecheck`
- [ ] Run `pnpm lint`
- [ ] Run `pnpm test`
- [ ] Run `pnpm build`
- [ ] Verify no new vulnerabilities: `pnpm audit --audit-level=high`

## 🧹 Dependency Cleanup

### Unused Dependencies

**Check for Unused:**
```bash
pnpm deps:unused
```

**Remove Unused:**
```bash
# Review output, then manually remove from package.json
pnpm remove <package-name>
```

**Common False Positives:**
- ESLint plugins (detected via specials)
- PostCSS plugins
- Build tools
- Husky/lint-staged

### Dead Code Detection

**Find Unused Exports:**
```bash
pnpm validate:dead-code
```

**Remove Dead Code:**
- Review reports in `reports/exports/`
- Remove unused exports carefully
- Test after removal

### Circular Dependencies

**Check for Cycles:**
```bash
pnpm validate:cycles
```

**Resolve Cycles:**
1. Identify circular import chain
2. Extract shared code to common module
3. Use dependency injection if needed
4. Verify fix: `pnpm validate:cycles`

## 📊 Dependency Health Monitoring

### Regular Checks

**Weekly:**
- Review Dependabot PRs
- Check for new vulnerabilities
- Review outdated packages

**Monthly:**
- Comprehensive dependency audit
- Review and remove unused dependencies
- Update major versions (if safe)

**Quarterly:**
- Full dependency review
- Major version updates
- Architecture dependency review

### Health Metrics

**Key Metrics:**
- **Vulnerability Count**: Should be 0 (high/critical)
- **Outdated Packages**: Track count over time
- **Override Count**: Minimize overrides
- **Bundle Size**: Monitor impact of dependencies

## 🛠️ Tools & Scripts

### Available Scripts

**Audit:**
- `pnpm audit:ci` - CI-ready audit (fails on high)
- `pnpm audit:ai` - AI dependency security audit
- `pnpm audit:full` - Comprehensive audit

**Dependency Analysis:**
- `pnpm deps:outdated` - Check outdated packages
- `pnpm deps:unused` - Find unused dependencies
- `pnpm deps:check` - Validate dependency cruiser config
- `pnpm deps:graph` - Generate dependency graph

**Validation:**
- `pnpm validate:dependencies` - Dependency cruiser validation
- `pnpm validate:cycles` - Check for circular dependencies
- `pnpm validate:orphans` - Find unused files

### CI Integration

**Automated Checks:**
- Security audit runs on every PR (`security-audit.yml`)
- Dependency validation in CI pipeline
- Scheduled weekly maintenance checks

## 📝 Best Practices

### Adding New Dependencies

**Before Adding:**
1. Check if similar functionality exists
2. Review package maintenance status
3. Check for known vulnerabilities
4. Verify license compatibility
5. Consider bundle size impact

**After Adding:**
1. Add to appropriate category (prod/dev)
2. Pin version (avoid `latest`)
3. Document why it's needed
4. Update dependency policy if needed

### Removing Dependencies

**Before Removing:**
1. Verify it's truly unused: `pnpm deps:unused`
2. Check for transitive dependencies
3. Test thoroughly after removal
4. Update documentation

### Version Pinning

**Guidelines:**
- **Production**: Pin exact versions for critical packages
- **Development**: Use caret (^) for flexibility
- **Security**: Always pin security-critical packages
- **Major Updates**: Test thoroughly before updating

## 🚨 Emergency Procedures

### Critical Vulnerability

**Process:**
1. **Immediate**: Run `pnpm audit --audit-level=high`
2. **Assess**: Review vulnerability severity and impact
3. **Fix**: Update or override vulnerable package
4. **Verify**: Run full test suite
5. **Deploy**: Push fix immediately
6. **Document**: Update dependency policy

### Breaking Update

**Process:**
1. **Identify**: Check changelog for breaking changes
2. **Plan**: Create migration plan
3. **Test**: Update in feature branch
4. **Fix**: Address breaking changes
5. **Verify**: Full test suite passes
6. **Merge**: Merge with comprehensive testing

## 📚 Related Documentation

- [Dependency Policy](../security/dependency-policy.md) - Security overrides and policies
- [Security Implementation](../security/security-implementation.md) - Security practices
- [CI/CD Enhancement Guide](../cicd-workflow/cicd-enhancement-guide.md) - Automated dependency checks
- [Development Tools](../tools-scripts/development-tools.md) - Development workflow

## 🔗 External Resources

- [pnpm Documentation](https://pnpm.io/)
- [npm Security Advisories](https://github.com/advisories)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

---

**Last updated:** 2025-01-15
