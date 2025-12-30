---
title: "Codebase"
description: ">-"
last_updated: "2025-12-30"
category: "documentation"
status: "generated"
---
# App Directory Structure

> **Note**: This file is auto-generated. To regenerate, run:
> ```bash
> pnpm exec tsx scripts/utils/scan-directory.ts app --max-depth 5 --exclude node_modules,.next,dist,coverage,.git > docs/codebase/app-directory-structure.md
> ```

## Directory Tree

🌳 Directory Structure: app

└── app
    ├── (auth)
    │   ├── sign-in
    │   │   ├── [[...sign-in]]
    │   │   │   ├── page.tsx
    │   ├── sign-up
    │   │   ├── [[...sign-up]]
    │   │   │   ├── page.tsx
    │   ├── `_theme.tsx`
    │   ├── error.tsx
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   ├── README.md
    ├── (marketing)
    │   ├── contact
    │   │   ├── page.tsx
    │   ├── cookies
    │   │   ├── page.tsx
    │   ├── insights
    │   │   ├── [slug]
    │   │   │   ├── not-found.tsx
    │   │   │   ├── page.tsx
    │   │   ├── categories
    │   │   │   ├── [category]
    │   │   │   │   ├── page.tsx
    │   │   ├── rss
    │   │   │   ├── route.ts
    │   │   ├── page.tsx
    │   ├── legal
    │   │   ├── page.tsx
    │   ├── pricing
    │   │   ├── page.tsx
    │   │   ├── scroll-to-faq.tsx
    │   ├── privacy
    │   │   ├── page.tsx
    │   ├── terms
    │   │   ├── page.tsx
    │   ├── `_theme.tsx`
    │   ├── error.tsx
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   ├── page.tsx
    │   ├── README.md
    ├── (protected)
    │   ├── dashboard
    │   │   ├── (entities)
    │   │   │   ├── [entity]
    │   │   │   │   ├── page.tsx
    │   │   ├── account
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx
    │   │   │   ├── user-profile-client.tsx
    │   │   ├── chat
    │   │   │   ├── page.tsx
    │   │   ├── subscription
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx
    │   │   ├── error.tsx
    │   │   ├── layout.tsx
    │   │   ├── page.tsx
    │   │   ├── README.md
    │   ├── client.tsx
    │   ├── error.tsx
    │   ├── layout.tsx
    │   ├── loading.tsx
    │   ├── README.md
    ├── api
    │   ├── health
    │   │   ├── clickhouse
    │   │   │   ├── route.ts
    │   │   ├── README.md
    │   │   ├── route.ts
    │   ├── internal
    │   │   ├── auth
    │   │   │   ├── route.ts
    │   │   ├── README.md
    │   ├── public
    │   │   ├── health
    │   │   │   ├── clickhouse
    │   │   │   │   ├── route.ts
    │   │   │   ├── route.ts
    │   ├── v1
    │   │   ├── ai
    │   │   │   ├── chat
    │   │   │   │   ├── route.ts
    │   │   │   ├── generate-sql
    │   │   │   │   ├── route.ts
    │   │   ├── csp-report
    │   │   │   ├── route.ts
    │   │   ├── entity
    │   │   │   ├── [entity]
    │   │   │   │   ├── export
    │   │   │   │   │   ├── route.ts
    │   │   │   │   ├── query
    │   │   │   │   │   ├── route.ts
    │   │   │   │   ├── route.ts
    │   │   ├── insights
    │   │   │   ├── search
    │   │   │   │   ├── route.ts
    │   │   ├── query
    │   │   │   ├── route.ts
    │   │   ├── user
    │   │   │   ├── route.ts
    │   │   ├── README.md
    │   ├── README.md
    ├── providers
    │   ├── route-theme-provider.tsx
    ├── global-error.tsx
    ├── layout.tsx
    ├── not-found.tsx
    ├── providers.tsx
    ├── README.md
    ├── sitemap.ts

📊 Summary: 46 dirs, 66 files, max depth: 5
