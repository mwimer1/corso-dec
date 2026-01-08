---
title: "Pull Request Template"
description: "Template for Corso repository pull requests"
last_updated: 2025-12-21
status: stable
category: workflow
---

## Summary
<!-- What changed and why -->

## Checklist (quality gates)
- [ ] Conventional Commit: `feat|fix|chore|docs|refactor(scope): subject`
- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test:ci` passes
- [ ] `pnpm validate:cursor-rules` passes
- [ ] `pnpm validate:ast-grep` passes
- [ ] `pnpm validate:dedupe` passes

## Risk & Rollback
- Risk level: Low / Medium / High
- Rollback plan: \<how to revert safely\>

## Screenshots / Notes

