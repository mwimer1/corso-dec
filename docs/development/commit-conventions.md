---
description: "Documentation and resources for documentation functionality. Located in development/."
last_updated: "2026-01-03"
category: "documentation"
status: "draft"
title: "Development"
---
# Commit Message Conventions

> **Source of Truth**: The authoritative list of allowed commit types and scopes is defined in `commitlint.config.cjs`. All documentation should reference this file.

This guide covers the commit message format, allowed types and scopes, and validation process for the Corso platform.

## 📋 Quick Reference

### Commit Message Format
```
type(scope): description
```

### Allowed Types
- `feat` - New features
- `fix` - Bug fixes
- `docs` - Documentation changes
- `style` - Formatting, missing semi colons, etc; no code change
- `refactor` - Refactoring production code
- `test` - Adding missing tests, refactoring tests; no production code change
- `chore` - Updating grunt tasks etc; no production code change
- `perf` - Performance improvement
- `ci` - CI/CD related changes
- `build` - Build system or external dependencies
- `revert` - Reverting previous commits

### Allowed Scopes

**⚠️ IMPORTANT**: Scopes are strictly enforced. Use only the scopes listed below.

The complete list of allowed scopes (22 total):

1. `auth` - Authentication and authorization
2. `dashboard` - Dashboard features and components
3. `chat` - Chat interface and AI features
4. `components` - UI components
5. `hooks` - React hooks
6. `api` - API routes and endpoints
7. `types` - TypeScript type definitions
8. `stripe` - Stripe integration
9. `openai` - OpenAI integration
10. `supabase` - Supabase integration
11. `clickhouse` - ClickHouse integration
12. `build` - Build system and tooling
13. `config` - Configuration files
14. `styles` - CSS and styling
15. `docs` - Documentation
16. `tests` - Test files and test utilities
17. `infrastructure` - Infrastructure and DevOps
18. `subscription` - Subscription management
19. `organization` - Organization management
20. `deps` - Dependencies
21. `db` - Database-related changes
22. `security` - Security-related changes

**Source**: See `commitlint.config.cjs` lines 21-47 for the authoritative list.

## 📝 Commit Message Guidelines

### Subject Line
- **Format**: `type(scope): description`
- **Length**: ≤ 50 characters (enforced)
- **Mood**: Use imperative mood ("add feature" not "added feature")
- **Case**: No PascalCase or UPPERCASE (enforced)
- **Punctuation**: Do not end with a period

### Body (Optional)
- **Length**: No line length limit (disabled in config)
- **Purpose**: Explain **what** and **why**, not **how**
- **Separation**: Separate from subject with blank line
- **Wrapping**: Wrap at 72 characters for readability

### Footer (Optional)
- **Length**: ≤ 72 characters per line (enforced)
- **Purpose**: Reference issues, breaking changes, etc.
- **Examples**: `Resolves: #123`, `BREAKING CHANGE: ...`

## ✅ Examples

### Good Examples

```bash
# Feature with scope
feat(dashboard): add entity grid with server-side pagination

# Bug fix
fix(api): handle missing webhook signature validation

# Documentation
docs(docs): update commit conventions documentation

# Refactoring
refactor(hooks): extract shared authentication logic

# Security fix
fix(security): patch SQL injection vulnerability

# Breaking change
feat(api)!: drop deprecated endpoint

# Multi-line body
feat(dashboard): add entity grid feature

This change introduces a new entity grid component that supports
server-side pagination and filtering. The grid uses AG Grid Enterprise
for advanced table features.

Resolves: #456
```

### Bad Examples

```bash
# ❌ Invalid scope (not in allowed list)
feat(billing): add payment processing
# Should be: feat(stripe): add payment processing

# ❌ Invalid scope (charts not allowed)
fix(charts): resolve data parsing
# Should be: fix(components): resolve data parsing

# ❌ Missing scope (optional but recommended)
feat: add new feature
# Better: feat(api): add new feature

# ❌ Wrong mood
feat(api): added rate limiting
# Should be: feat(api): add rate limiting

# ❌ Too long subject
feat(dashboard): add comprehensive entity grid with server-side pagination and filtering support
# Should be: feat(dashboard): add entity grid with server-side pagination

# ❌ PascalCase in subject
feat(API): Add Rate Limiting
# Should be: feat(api): add rate limiting
```

## 🔍 Validation Process

### Automatic Validation

Commit messages are automatically validated using `commitlint` via the `commit-msg` git hook (`.husky/commit-msg`).

**Validation Rules**:
- ✅ Type must be in allowed list
- ✅ Scope must be in allowed list (strictly enforced)
- ✅ Subject case validation (no PascalCase/UPPERCASE)
- ✅ Subject length ≤ 100 characters
- ✅ Footer line length ≤ 72 characters

### Manual Validation

You can manually validate a commit message:

```bash
# Validate a message from stdin
echo "feat(api): add rate limiting" | pnpm exec commitlint

# Validate a file
pnpm exec commitlint --edit .git/COMMIT_EDITMSG
```

### Documentation Consistency Validation (Optional)

To verify that commit scope documentation matches `commitlint.config.cjs`:

```bash
pnpm validate:commit-scopes
```

**Note**: This validation script is optional and not part of CI or pre-commit hooks. It's useful for maintaining documentation consistency when scopes are added or updated.

### Common Validation Errors

#### Invalid Scope
```
✖   scope must be one of [auth, dashboard, chat, ...] [scope-enum]
```

**Solution**: Check `commitlint.config.cjs` for the complete list of allowed scopes.

#### Invalid Type
```
✖   type must be one of [feat, fix, docs, ...] [type-enum]
```

**Solution**: Use one of the allowed types listed in the Quick Reference section.

#### Subject Case Error
```
✖   subject may not be [pascal-case|upper-case] [subject-case]
```

**Solution**: Use lowercase for the subject line.

## 🔧 Configuration

### Commitlint Configuration

The commit message validation rules are defined in `commitlint.config.cjs`:

- **Extends**: `@commitlint/config-conventional`
- **Type Enum**: Lines 4-19
- **Scope Enum**: Lines 21-47 (authoritative list)
- **Other Rules**: Lines 49-52

### Git Hook

The commit-msg hook is configured in `.husky/commit-msg`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/husky.sh"
pnpm exec commitlint --edit "$1"
```

## 📚 Related Documentation

- **Git Workflow**: See `.cursor/rules/ai-agent-development-environment.mdc` for git workflow and branching strategy
- **Husky Hooks**: See `.husky/README.md` for git hooks documentation
- **CI/CD**: See `docs/cicd-workflow/ci-pipeline.md` for CI validation

## 🚨 Troubleshooting

### Commit Fails with "Invalid Scope"

1. Check `commitlint.config.cjs` for the complete list of allowed scopes
2. Verify your scope matches exactly (case-sensitive)
3. If you need a new scope, update `commitlint.config.cjs` first, then commit

### Commit Fails with "Invalid Type"

1. Use one of the allowed types from the Quick Reference section
2. Common mistake: using `feature` instead of `feat`

### Bypassing Validation (Not Recommended)

If you absolutely must bypass validation (emergency hotfix, etc.):

```bash
git commit --no-verify -m "fix(api): emergency hotfix"
```

**⚠️ WARNING**: Only use `--no-verify` in emergencies. CI will still validate your commit message.

## 🔄 Adding New Scopes

If you need to add a new scope:

1. **Update `commitlint.config.cjs`** - Add the new scope to the `scope-enum` array (lines 21-47)
2. **Update this documentation** - Add the new scope to the "Allowed Scopes" section
3. **Update `.gitmessage`** - Add the new scope to the template
4. **Update cursor rules** - Update `.cursor/rules/ai-agent-development-environment.mdc` if it lists scopes
5. **Run validation** - Ensure `pnpm exec commitlint` still works
6. **Commit the changes** - Use an appropriate scope (e.g., `chore(config): add new commit scope`)

## 📊 Scope Usage Guidelines

### When to Use Each Scope

- **`auth`**: Authentication, authorization, user sessions, RBAC
- **`dashboard`**: Dashboard pages, layouts, entity grids
- **`chat`**: Chat interface, AI chat features
- **`components`**: Reusable UI components
- **`hooks`**: React hooks, custom hooks
- **`api`**: API routes, endpoints, handlers
- **`types`**: TypeScript types, interfaces, type definitions
- **`stripe`**: Stripe payment integration
- **`openai`**: OpenAI API integration
- **`supabase`**: Supabase database integration
- **`clickhouse`**: ClickHouse data warehouse integration
- **`build`**: Build scripts, webpack, bundling
- **`config`**: Configuration files, environment setup
- **`styles`**: CSS, Tailwind, styling changes
- **`docs`**: Documentation files, README updates
- **`tests`**: Test files, test utilities, test configuration
- **`infrastructure`**: CI/CD, deployment, infrastructure
- **`subscription`**: Subscription management features
- **`organization`**: Organization management features
- **`deps`**: Dependency updates, package.json changes
- **`db`**: Database migrations, schema changes
- **`security`**: Security fixes, security enhancements

### Scope Selection Tips

1. **Be specific**: Use the most specific scope that applies
2. **Prefer feature scopes**: Use `dashboard`, `chat`, `api` over generic `components` when possible
3. **Use integration scopes**: Use `stripe`, `openai`, `supabase`, `clickhouse` for integration-specific changes
4. **Use infrastructure scopes**: Use `build`, `config`, `infrastructure` for tooling and DevOps changes
