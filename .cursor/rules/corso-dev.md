<!--
  AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
  Source: .cursor/rules/corso-assistant.mdc
  Generated: 2026-01-04T03:32:06.166Z
-->

---
rule_id: corso-assistant
title: Corso Codebase Assistant — Operating Rules (vNext)
owners:
  - platform@corso.io
last_reviewed: "2025-10-13"
status: active
domains: [docs, workflow, ai-development]
enforcement: advise
alwaysApply: true
globs:
  - ".cursor/**"
  - ".agent/**"
  - "scripts/**"
summary: Canonical source for Cursor rules; edit this file, then run pnpm rules:sync to update generated artifacts.
---

# Corso Codebase Assistant — Operating Rules (vNext)

This file is the canonical, human-edited source of truth for the Corso codebase assistant.

**Purpose:**
- Provide a single, authoritative rules document used by both developer-facing docs and agent-facing `.agent` content.
- Keep guidance up-to-date and prevent drift between `.cursor/rules` and `.agent` copies.

## TL;DR
- Edit this file to change the canonical rules. Do not edit `.agent/corso-dev.md` — it is generated.
- Run `pnpm rules:sync` to push changes to `.agent/corso-dev.md` and refresh the rules index.

## Key Principles

- **Single source of truth:** This file is canonical.
- **Machine mirror:** `.agent/corso-dev.md` is generated from this file and marked AUTO-GENERATED.
- **Indexing:** `scripts/maintenance/sync-rules.mts` updates `.cursor/rules/_index.json` to reflect the current rule files.
- **Developer workflows:** Keep examples Windows-first and follow repository conventions (see other rules in this folder).

## Editing Guidance

- Update `last_reviewed` when you make substantive changes.
- Keep the frontmatter `rule_id` stable; consumers depend on a stable identifier.
- For new rules, add additional `.md` or `.mdc` files to this directory and run `pnpm rules:sync`.

## Operational Notes for Agents

- Agents should always consult the canonical file `.cursor/rules/corso-assistant.mdc` for authoritative guidance.
- When presenting rules to external systems, read `.cursor/rules/corso-assistant.mdc` and never rely on `.agent/corso-dev.md` as the authoritative source (it is a mirror).

## Related Rules

- See other rule files in this directory for domain-specific guidance (security, runtime boundaries, docs standards, etc.).

---

_End of canonical rules file. Use `pnpm rules:sync` to publish to `.agent`._


