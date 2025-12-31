---
title: "Cicd Workflow"
description: "Documentation and resources for documentation functionality. Located in cicd-workflow/."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
---
# CI Workflows

## Node & pnpm Setup (Composite)

- Always use `./.github/actions/setup-node-pnpm` in jobs that run `pnpm`.
- Do not pass `node-version`; Node is read from `.node-version`.
- Prefer the composite default which reads `packageManager` via Corepack; only pass `pnpm-version` when explicitly needed.
- The Workflow Consistency job runs on PRs changing workflows and weekly; it fails if a job runs `pnpm` without the composite or before setup.

Example:

```yaml
- uses: ./.github/actions/setup-node-pnpm
  with:
    run-install: 'true'
```bash

## Workflow Consistency Check

- Runs on PRs that modify workflow or composite action files, and weekly on Mondays (14:00 UTC).
- Fails if any job runs `pnpm` before setup or omits the composite `./.github/actions/setup-node-pnpm`.
- Output:
  - Job Summary: markdown table of all jobs, including offenders.
  - Artifact: `reports/ci/workflows-consistency.report.json` (full JSON report) retained for 30 days.
- Fix guidance: Ensure a step using `./.github/actions/setup-node-pnpm` appears before any `pnpm` commands in each job.
