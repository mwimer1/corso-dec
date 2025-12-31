---
title: "Patterns"
description: "Styling system for styles, using Tailwind CSS and design tokens. Located in ui/patterns/."
last_updated: "2025-12-31"
category: "styling"
status: "draft"
---
# Repository Scripts & Docs

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `styles/ui/patterns`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## Rendering Guidance

**Avoid global or container-level text rendering overrides**: Prefer browser defaults for text rendering. Avoid `text-rendering: optimizelegibility` on containers as it:
- Is an inherited property that affects all nested text
- Can reduce text crispness on some browsers/OS combinations
- May cause pixelation/blurry text issues

**Best Practice**: Let the browser handle text rendering defaults. Only apply text rendering overrides when absolutely necessary and scope them to specific elements, not containers.
