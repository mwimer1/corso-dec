---
status: "draft"
last_updated: "2026-01-09"
category: "documentation"
---
# Architecture Decision Records (ADRs)

Last updated: 2026-01-07

This folder contains Architecture Decision Records (ADRs) documenting key technical and architectural decisions made for the Corso platform. ADRs provide a historical record of why certain decisions were made and help maintain context for future development.

## 📋 Purpose

ADRs document:
- **Technical decisions** that affect system architecture or design
- **Rationale** for choosing one approach over alternatives
- **Context** and constraints that influenced the decision
- **Consequences** and trade-offs of the decision

## 📚 Current Decisions

- [Route Theme Duplication (KEEP)](route-theme-duplication.md) - Decision to keep duplicate `_theme.tsx` files for server/client boundary clarity

## 📝 ADR Format

When creating a new ADR, follow this structure:

```markdown
---
status: "draft" | "accepted" | "deprecated"
last_updated: YYYY-MM-DD
category: "documentation"
title: "Decision Title"
description: "Brief description"
---

# Decision: [Title]

**Date**: YYYY-MM-DD  
**Status**: ✅ Accepted | 🔄 Proposed | ❌ Rejected | 📦 Superseded  
**Decision Type**: Architecture | Design | Process | Technology

## Context

[Background and problem statement]

## Decision

[The decision that was made]

## Rationale

[Why this decision was made]

## Consequences

[Positive and negative consequences]

## Alternatives Considered

[Other options that were evaluated]
```

## 🔗 Related Documentation

- [Architecture Overview](../architecture/architecture-overview.md) - High-level system architecture
- [Architecture & Design](../architecture/) - Technical architecture documentation
- [Development Guides](../development/) - Development standards and practices

---

**See Also**: [Documentation Index](../README.md)
