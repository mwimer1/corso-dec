---
title: "Rules"
description: "Documentation and resources for documentation functionality. Located in rules/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# Cursor AI Rules

> **Comprehensive rules and standards for Cursor AI development environment, ensuring consistent code quality, security, and development practices across the Corso platform.**

## 📋 Quick Reference

**Key Points:**

- **AI Agent Development**: Windows-first, cross-platform-safe guidance for agents and scripts
- **Security Standards**: Zero-trust architecture with authentication, validation, and rate limiting
- **Code Quality**: Strict TypeScript, consistent formatting, and organized imports
- **Edge-safe Redirects**: Edge routes receive Web `Request`; use widened helpers or native `NextResponse.redirect(new URL(..., req.url), 308)`
- **API Builder**: Prefer `makeEdgeRoute` for API routes to compose Zod validation, rate limiting, and error handling
- **Component Architecture**: Atomic design principles with proper theming and accessibility
- **Warehouse Query Hooks**: Secure, performant React hooks for ClickHouse data warehouse queries
- **Analytics Tracking**: Edge-safe analytics with graceful degradation and privacy-first approach

## 📑 Table of Contents

- [Overview](#overview)
- [Available Rules](#available-rules)
- [Rule Structure](#rule-structure)
- [Enforcement](#enforcement)
- [Quick Start](#quick-start)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)

---

## Overview

This directory contains **13 comprehensive rules** plus supporting files that guide Cursor AI development, ensuring consistent code quality, security, and development practices across the Corso platform. These rules are designed to be enforced through CI/CD pipelines, linting tools, and development workflows.

### Architecture

The rules follow a hierarchical structure with:
- **Global Rules**: Applied across the entire codebase (`alwaysApply: true`)
- **Domain-Specific Rules**: Tailored to specific areas like API, components, or security
- **Enforcement Mechanisms**: Automated validation through ESLint, ast-grep, and CI checks

## Available Rules

### 🔧 **Development Environment & Workflow**
- **[`ai-agent-development-environment`](ai-agent-development-environment.mdc)**: Windows-first, cross-platform-safe guidance for agents and scripts
- **[`actions-rate-limit-check`](actions-rate-limit-check.mdc)**: Rate limiting validation for actions
- **[`duplicate-action-validation`](duplicate-action-validation.mdc)**: Prevent duplicate validation in action wrappers

### 🛡️ **Security & API**
- **[`security-standards`](security-standards.mdc)**: Zero-trust architecture with authentication, validation, and rate limiting
- **[`openapi-vendor-extensions`](openapi-vendor-extensions.mdc)**: RBAC and tenant isolation in OpenAPI specs
- **[`runtime-boundaries`](runtime-boundaries.mdc)**: Runtime boundaries & server/Edge imports

### 🎨 **Design System & Components**
- **[`component-design-system`](component-design-system.mdc)**: Comprehensive component architecture, atomic design patterns, import conventions, and design system standards (consolidated)
- **[`dashboard-components`](dashboard-components.mdc)**: Dashboard chat and table components with proper boundaries and guardrails (consolidated)

### 📊 **Data & Analytics**
- **[`warehouse-query-hooks`](warehouse-query-hooks.mdc)**: Secure, performant React hooks for ClickHouse queries
- **[`analytics-tracking`](analytics-tracking.mdc)**: Edge-safe analytics with graceful degradation

### 📚 **Documentation & Quality**
- **[`documentation-standards`](documentation-standards.mdc)**: Documentation consistency, canonical references, and maintenance standards (consolidated)
- **[`file-organization`](file-organization.mdc)**: DDD-aligned layout and barrel usage
- **[`code-quality-standards`](code-quality-standards.mdc)**: ESLint rules, TypeScript standards, formatting, and testing

## Quick Start

### For AI Agents
1. **Read the overview** above to understand the rule landscape
2. **Check rule applicability** using the `alwaysApply` and `globs` metadata
3. **Follow enforcement mechanisms** for automated validation
4. **Use canonical snippets** from [`_snippets.mdc`](_snippets.mdc) for consistent patterns

### For Developers
1. **Browse by category** above to find relevant rules
2. **Follow quick reference** guidelines for immediate action
3. **Use examples** provided in each rule file
4. **Run validation** commands to ensure compliance

### Validation Commands
```bash
# Validate all rules
pnpm validate:cursor-rules

# Check specific rule enforcement
ast-grep run --rule .cursor/rules/security-standards.mdc

# Validate OpenAPI compliance
pnpm openapi:rbac:check

# Check runtime boundaries
pnpm validate:runtime-boundaries

# Quality gates
pnpm typecheck && pnpm lint && pnpm test
```

### Performance Monitor (Index Optimization)
```bash
# Run the Cursor rules performance monitor (writes reports/cursor-rules-performance.json)
pnpm validate:cursor-rules:perf
```

## Rule Structure

Each rule file follows a consistent format with frontmatter metadata for discoverability and automated processing:

```yaml
---
rule_id: cursor/rule-name
title: Human-readable title
owners: [team@corso.io]
last_reviewed: YYYY-MM-DD
status: stable
domains: [domain1, domain2]
enforcement: [mechanism1, mechanism2]
related_rules: [cursor/security-standards]
alwaysApply: true|false
globs: ["**/*"]
---
```

### Key Metadata Fields

| Field | Purpose | Example |
|-------|---------|---------|
| `rule_id` | Unique identifier | `cursor/security-standards` |
| `owners` | Responsible teams | `["security@corso.io", "platform@corso.io"]` |
| `last_reviewed` | Last validation date | `2025-09-06` |
| `domains` | Applicable areas | `["security", "api"]` |
| `enforcement` | Validation methods | `["ast-grep:withErrorHandlingEdge"]` |
| `alwaysApply` | Global vs. targeted | `true` for security rules |
| `globs` | File patterns | `["app/api/**", "actions/**"]` |

## Enforcement

### **Automated Enforcement**
- **ast-grep Patterns**: Code pattern validation (`pnpm validate:ast-grep`)
- **CI Validation**: Automated checks in CI/CD pipelines (`pnpm validate:cursor-rules`)
- **OpenAPI Guards**: RBAC and security validation (`pnpm openapi:rbac:check`)
- **Runtime Boundaries**: Server/Edge import validation (`pnpm validate:runtime-boundaries`)

### **Enforcement Status**

| Rule Category | Enforcement Level | Validation Command |
|---------------|-------------------|-------------------|
| Security | STRICT | `pnpm validate:cursor-rules` |
| Code Quality | STRICT | `pnpm typecheck && pnpm lint` |
| Documentation | WARNING | `pnpm docs:lint` |
| Design System | INFO | Manual review |

### **Windows-First Guidelines**
- Prefer `git --no-pager` for Windows compatibility
- Avoid Unix-only pipes; use `| type` when piping is needed
- Run validation commands sequentially, not chained with `&&`
- Use forward slashes in file paths for consistency

## Usage Examples

### **API Route with Security Standards**
```typescript
// ✅ CORRECT: makeEdgeRoute with Zod validation + rate limiting
import { makeEdgeRoute } from '@/lib/api/shared/edge-route';
import { http } from '@/lib/api';
import { z } from 'zod';

const Body = z.object({
  question: z.string().min(1).max(1000),
  tableIntent: z.string().optional(),
}).strict();

export const POST = makeEdgeRoute({
  schema: Body,
  rateLimit: { windowMs: 60_000, maxRequests: 30 },
  handler: async (_req, { question, tableIntent }) => {
    const data = await processQuery(question, tableIntent);
    return http.ok({ data });
  },
});
```

### **Warehouse Query Hooks**
```typescript
// ✅ CORRECT: Type-safe warehouse queries with caching
import { useWarehouseQueryCached } from '@/hooks/dashboard';

const { data, isLoading, error } = useWarehouseQueryCached<ProjectRow>(
  ['projects', filters], // Cache key
  'SELECT * FROM projects WHERE status = ?',
  { staleTime: 5 * 60 * 1000 } // 5 minutes
);

// Handle all states
if (isLoading) return <div>Loading projects...</div>;
if (error) return <div>Error: {error.message}</div>;
if (!data?.length) return <div>No projects found</div>;

return <ProjectsList projects={data} />;
```

### **Component Import Conventions**
```typescript
// ✅ CORRECT: Using atomic design barrels
import { Button } from '@/atoms';
import { FormField } from '@/molecules';
import { AnalyticsChart } from '@/organisms';

// ✅ CORRECT: Domain-specific imports
import { useDashboardContext } from '@/components/dashboard';
import { Hero } from '@/components/landing';

// ✅ CORRECT: Type imports
import type { NavItem } from '@/types/dashboard/table';
import type { OnboardingStepId } from '@/types/onboarding/flow/types';
```

### **Analytics Tracking**
```typescript
// ✅ CORRECT: Edge-safe tracking with graceful degradation
import { trackNavClick } from '@/lib/shared/analytics/track';

const handleClick = useCallback((event) => {
  // Track click first (never throws)
  trackNavClick("Features", "/#features");

  // Then handle navigation
  navigate('/features');
}, []);
```

### **Edge-safe Redirects**
```typescript
// ✅ CORRECT: Edge routes receive Web Request
import { NextResponse } from 'next/server';
export const runtime = 'edge';

export async function GET(req: Request) {
  return NextResponse.redirect(new URL('/api/v1/path', req.url), 308);
}
```

### **Environment Variable Access**
```typescript
// ✅ CORRECT: Use centralized config, never process.env directly
import { getEnv } from '@/lib/shared/env';

const env = getEnv();
const apiKey = env.OPENAI_API_KEY;
const rateLimit = env.OPENAI_RATE_LIMIT_PER_MIN ?? 30;
```

## Best Practices

### **For AI Agents**
- **Read rule frontmatter** first (`rule_id`, `alwaysApply`, `globs`) to determine applicability
- **Check enforcement mechanisms** for automated validation options
- **Use canonical snippets** from `_snippets.mdc` for consistent implementation
- **Follow domain-specific rules** when working in specialized areas (API, components, etc.)

### **For Developers**
- **Browse by category** to find relevant rules quickly
- **Follow quick reference** guidelines for immediate action
- **Use provided examples** as templates for implementation
- **Run validation commands** after changes to ensure compliance

## Rule Discovery & Navigation

### **Finding Relevant Rules**
1. **By Domain**: Check the categories above (Security, Components, etc.)
2. **By File Pattern**: Use `globs` in rule frontmatter to find applicable rules
3. **By Enforcement**: Look for `alwaysApply: true` rules first
4. **By Related Rules**: Follow links to discover complementary rules

### **Rule Validation Workflow**
```bash
# Quick validation (development)
pnpm typecheck

# Full quality gates
pnpm typecheck
pnpm lint
pnpm test
pnpm validate:cursor-rules

# Domain-specific validation
pnpm openapi:rbac:check          # API security
pnpm validate:runtime-boundaries # Server/Edge boundaries
pnpm validate:ast-grep          # Code patterns
```

## Troubleshooting

### **Rule Conflicts**
**Problem**: Multiple rules provide conflicting guidance
**Solution**: Check `related_rules` field and follow domain hierarchy (security > quality > style)

### **Enforcement Failures**
**Problem**: Validation fails unexpectedly
**Solution**:
```bash
# Debug specific rule
ast-grep run --rule .cursor/rules/rule-name.mdc --debug

# Check rule syntax
pnpm validate:cursor-rules --verbose
```

### **Missing Rule Coverage**
**Problem**: No rule exists for a specific pattern
**Solution**: Check `_index.json` for existing rules or propose new rule to owners

## Key Resources

| Resource | Purpose | Location |
|----------|---------|----------|
| **Canonical Snippets** | Reusable code examples | [`_snippets.mdc`](_snippets.mdc) |
| **Rule Index** | Complete rule registry | [`_index.json`](_index.json) |
| **Security Standards** | API & authentication patterns | [`security-standards.mdc`](security-standards.mdc) |
| **Component Architecture** | Design system guidelines | [`component-design-system.mdc`](component-design-system.mdc) |
| **Code Quality** | TypeScript & testing standards | [`code-quality-standards.mdc`](code-quality-standards.mdc) |

---

## 🎯 Implementation Priority

**High Priority (Always Apply):**
- `security-standards` - Zero-trust architecture
- `runtime-boundaries` - Server/Edge import safety
- `code-quality-standards` - TypeScript & testing

**Medium Priority (Domain-Specific):**
- `openapi-vendor-extensions` - API security
- `warehouse-query-hooks` - Data layer patterns
- `analytics-tracking` - User insights

**Contextual Priority:**
- `component-architecture` - UI development
- `atomic-design-imports` - Component usage
- `docs-consistency` - Documentation maintenance

---

## 📞 Support & Ownership

**Rule Owners:**
- **Security**: `security@corso.io`, `platform@corso.io`
- **Platform**: `platform@corso.io`, `devx@corso.io`
- **Design System**: `design-system@corso.io`
- **Documentation**: `docs@corso.io`

**For Questions:**
- Check rule `last_reviewed` date for currency
- Review `related_rules` for additional context
- Use examples from `_snippets.mdc` for implementation

---

## 🚀 Recent Optimization Achievements (2025-10-06)

### 📊 Rule Consolidation & Optimization
**Major consolidation reduced rule count and improved maintainability:**
- **Rule count update**: 13 comprehensive rules (accurate count)
- **Consolidated rules**: Component design system, dashboard components, documentation standards
- **Metadata standardization**: All rules updated to current date (2025-09-27)
- **Enforcement coverage**: Added enforcement mechanisms to previously unenforced rules
- **Content optimization**: Eliminated duplicate sections and improved template usage

#### **Consolidation Strategy:**
- ✅ **Component rules**: Merged atomic-design-imports + component-architecture + design-system-types → component-design-system
- ✅ **Dashboard rules**: Merged dashboard-chat + dashboard-tables → dashboard-components
- ✅ **Documentation rules**: Merged docs-consistency + nextjs-docs → documentation-standards
- ✅ **Metadata standardization**: Updated all last_reviewed dates to 2025-10-06
- ✅ **Entity dashboard audit**: Comprehensive review and documentation update for entity system
- ✅ **Dead code removal**: Eliminated deprecated company-name-renderer.tsx file
- ✅ **Documentation accuracy**: Updated entity implementation status across all docs

### 📋 Shared Templates Created
**New `templates/rule-templates.mdc` provides standardized patterns:**
- ✅ **Frontmatter templates**: Standard and security-specific rule headers
- ✅ **Common sections**: Windows-first tips, quality gates, enforcement patterns
- ✅ **Content templates**: Do/don't patterns, code examples, testing templates
- ✅ **Validation commands**: Standardized command patterns and Windows compatibility

### 🎯 Quality Improvements
- **Maintainability**: Easier to create new rules using shared templates
- **Consistency**: Standardized sections and formatting across all rules
- **Documentation**: Clear templates for common rule patterns
- **Performance**: Reduced duplication improves parsing and maintenance efficiency

---

**Last Updated:** 2025-10-06 | **Rules:** 13 | **Templates:** 1 | **Enforced:** STRICT
