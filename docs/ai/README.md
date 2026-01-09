---
status: "draft"
last_updated: "2026-01-09"
category: "documentation"
---
# AI Documentation

Last updated: 2026-01-07

This folder contains extended documentation for AI agent rules and development standards. These documents provide detailed examples, migration guides, and comprehensive patterns that complement the canonical rules in `.cursor/rules/`.

## 📋 Overview

The AI documentation structure:
- **Canonical Rules**: Located in `.cursor/rules/` - concise, authoritative rules
- **Extended Documentation**: Located in `docs/ai/rules/` - detailed examples, patterns, and guides

## 📚 Rules Documentation

### Core Standards

- [Security Standards](rules/security-standards.md) - Extended security patterns, examples, and migration guides (canonical: `.cursor/rules/security-standards.mdc`)
- [Component Design System](rules/component-design-system.md) - Extended component architecture patterns (canonical: `.cursor/rules/component-design-system.mdc`)
- [Dashboard Components](rules/dashboard-components.md) - Extended dashboard component patterns (canonical: `.cursor/rules/dashboard-components.mdc`)
- [Entity Grid Architecture](rules/entity-grid-architecture.md) - Extended entity grid patterns (canonical: `.cursor/rules/entity-grid-architecture.mdc`)

### API & Integration

- [OpenAPI Vendor Extensions](rules/openapi-vendor-extensions.md) - Extended OpenAPI RBAC patterns (canonical: `.cursor/rules/openapi-vendor-extensions.mdc`)
- [Analytics Tracking](rules/analytics-tracking.md) - Extended analytics tracking patterns (canonical: `.cursor/rules/analytics-tracking.mdc`)

### Reports & References

- [BEFORE_TOKEN_REPORT](rules/BEFORE_TOKEN_REPORT.md) - Token usage report before refactoring
- [AFTER_TOKEN_REPORT](rules/AFTER_TOKEN_REPORT.md) - Token usage report after refactoring
- [REFACTOR_SUMMARY](rules/REFACTOR_SUMMARY.md) - Summary of refactoring work

## 🔗 Related Documentation

### Canonical Rules
- [Security Standards](../../.cursor/rules/security-standards.mdc) - Zero-trust architecture and security patterns
- [Component Design System](../../.cursor/rules/component-design-system.mdc) - Component architecture standards
- [Dashboard Components](../../.cursor/rules/dashboard-components.mdc) - Dashboard component patterns
- [Entity Grid Architecture](../../.cursor/rules/entity-grid-architecture.mdc) - Entity grid standards
- [OpenAPI Vendor Extensions](../../.cursor/rules/openapi-vendor-extensions.mdc) - OpenAPI RBAC enforcement
- [Analytics Tracking](../../.cursor/rules/analytics-tracking.mdc) - Analytics tracking patterns

### Architecture & Development
- [Architecture Overview](../architecture/architecture-overview.md) - System architecture
- [Development Guides](../development/) - Development standards and practices
- [API Design Guide](../api/api-design-guide.md) - API development patterns

## 📝 Documentation Structure

### Rule Documentation Pattern

Each extended rule document follows this pattern:
1. **Reference to Canonical Rule**: Links to the authoritative rule in `.cursor/rules/`
2. **Extended Examples**: Detailed code examples and patterns
3. **Migration Guides**: Step-by-step migration instructions
4. **Troubleshooting**: Common issues and solutions
5. **Advanced Patterns**: Complex use cases and edge cases

### When to Use Extended Docs

- **Learning**: Understanding detailed patterns and examples
- **Migration**: Following step-by-step migration guides
- **Troubleshooting**: Finding solutions to common issues
- **Advanced Use Cases**: Implementing complex patterns

### When to Use Canonical Rules

- **Quick Reference**: Fast lookup of rules and standards
- **Enforcement**: CI/CD validation and linting
- **Decision Making**: Authoritative source for standards

---

**See Also**: [Documentation Index](../README.md)
