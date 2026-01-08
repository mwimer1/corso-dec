# Cursor Rule Templates
# This file contains shared templates for common rule sections and patterns
# DO NOT use this file directly - copy patterns into your rules

## Common Frontmatter Patterns

### Standard Rule Frontmatter
```yaml
---
rule_id: cursor/rule-name
title: Human-readable title
summary: Brief description of rule (<120 chars)
owners:
  - team@corso.io
last_reviewed: YYYY-MM-DD
status: active
domains: [primary, secondary]
enforcement: advise|warn|block
related_rules:
  - cursor/related-rule
alwaysApply: true|false
globs: ["**/*.{ext}"]
---
```

### Security Rule Frontmatter
```yaml
---
rule_id: cursor/security-rule
title: Security Rule Title
summary: Brief security-focused description (<120 chars)
owners:
  - security@corso.io
  - platform@corso.io
last_reviewed: YYYY-MM-DD
status: active
domains: [security, api]
enforcement: block
related_rules:
  - cursor/security-standards
alwaysApply: true
globs: ["app/api/**", "lib/**"]
---
```

## Common Section Templates

### Windows-First Tips Section (Reference Only)
**NOTE**: All Windows-first tips should reference the canonical section in `ai-agent-development-environment.mdc`:

```markdown
## Windows-first tips

See the canonical guidance in
[ai-agent-development-environment.mdc](mdc:.cursor/rules/ai-agent-development-environment.mdc#windows-first-tips).
```

### Quality Gates Section (Reference Only)
**NOTE**: All quality gates should reference the canonical section in `ai-agent-development-environment.mdc`:

```markdown
## Quality gates

See the canonical command set in
[ai-agent-development-environment.mdc](mdc:.cursor/rules/ai-agent-development-environment.mdc#quality-gates-and-validation-commands).
```

### Related Rules Section
```markdown
## Related Rules

- `cursor/security-standards` - Security patterns and authentication
- `cursor/code-quality-standards` - TypeScript and testing standards
- `cursor/runtime-boundaries` - Server/Edge import safety
```

### Enforcement Section
```markdown
## Enforcement

### AST-Grep Rules
```yaml
# Detect violations
rule: |
  pattern_to_match
  where:
    condition: true

# Prevent common mistakes
rule: |
  forbidden_pattern
  where:
    not: allowed_condition
```

### ESLint Integration
```javascript
// .eslintrc.mjs
{
  rules: {
    '@corso/rule-name': 'error'
  }
}
```
```

## Common Content Patterns

### Rule Description Template
```markdown
# Rule Title

**Brief description of what this rule enforces and why it matters.**

## TL;DR
- **Key Point 1**: Brief explanation
- **Key Point 2**: Brief explanation
- **Key Point 3**: Brief explanation

## Purpose (2-6 lines)
Brief explanation of why this rule exists and what problem it solves.
```

### Do/Don't Section Template
```markdown
## Do
- **Pattern**: Description of recommended approach
- **Example**: Brief code example
- **Rationale**: Why this pattern is preferred

## Don't
- **Anti-pattern**: Description of what to avoid
- **Bad Example**: Brief code example
- **Consequence**: Why this is problematic
```

### Example Code Template
```typescript
// ✅ CORRECT: Recommended approach
export function exampleFunction(param: Type): ReturnType {
  // Implementation
  return result;
}

// ❌ INCORRECT: What to avoid
export function badExample(param: any): any {
  // Problematic implementation
  return result;
}
```

### Testing Pattern Template
```typescript
// Test pattern for rule validation
describe('RuleName', () => {
  it('should pass valid cases', () => {
    // Test valid implementations
  });

  it('should fail invalid cases', () => {
    // Test invalid implementations
  });
});
```

## Common Metadata Patterns

### Standard Metadata Values
- `status`: `"active"` (default)
- `domains`: `["docs"]` (default)
- `owners`: `["platform@corso.io"]` (default)
- `enforcement`: `"advise"` (default: advise|warn|block)
- `summary`: Required (<120 chars)

### Common Domain Values
- `"security"` - Security and authentication
- `"api"` - API patterns and validation
- `"components"` - React component patterns
- `"docs"` - Documentation standards
- `"runtime"` - Server/Edge boundaries
- `"analytics"` - Analytics and tracking
- `"hooks"` - Custom React hooks
- `"quality"` - Code quality standards
- `"testing"` - Testing patterns
- `"tools"` - Development tooling

### Common Enforcement Patterns
- `"ast-grep:pattern"` - AST-based pattern matching
- `"script:validator"` - Custom validation script
- `"ci: validate:cursor-rules"` - CI rule validation
- `"ci: validate:ast-grep"` - AST-grep validation
