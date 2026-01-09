---
title: "Dependency Management Guide"
description: "Policies and workflows for adding, upgrading, auditing, and removing dependencies in Corso."
last_updated: "2026-01-09"
category: "documentation"
status: "draft"
---

# Dependency Management Guide

## Purpose

This guide defines how Corso manages dependencies across the pnpm workspace (approval rules, upgrade cadence, overrides, audits, and safe removal).

## Status

This document is intentionally a stub. It exists to reserve the canonical path and prevent drift while we finalize the dependency policy.

## TODO

### Policy
- Define allowed dependency categories (runtime vs dev-only; server-only vs client-safe).
- Define approval + review rules for new dependencies (who/when, exceptions).
- Define upgrade cadence (weekly/monthly) and "fast track" rules for security fixes.

### pnpm workspace mechanics
- Document `pnpm` workspace conventions (where deps live, hoisting expectations, workspace protocol usage).
- Document overrides/resolutions policy (when to pin, how to document why).

### Security & audits
- Document how advisories are handled (triage → patch → verify → follow-up).
- Document required checks/gates (what CI enforces vs local checks).
- Add examples for common workflows (upgrade Next/React; pin a vulnerable transitive dep).

### Removal workflow
- Removal checklist (find usages → remove → run knip/ts-prune → run tests → verify bundle/build).
- Post-removal cleanup (docs updates, CHANGELOG notes if needed).

## Related commands

- `pnpm docs:validate`
- `pnpm docs:generate:readme`
- `pnpm quality:ci`
