---
title: Codebase
description: >-
  Documentation and resources for documentation functionality. Located in
  codebase/.
last_updated: '2025-12-31'
category: documentation
status: draft
---
# Repository Directory Structure

> **Note**: This file is auto-generated. To regenerate, run:
> ```bash
> pnpm exec tsx scripts/utils/scan-directory.ts . --max-depth 6 --exclude node_modules,.next,dist,coverage,.git,.cache,reports,test-results,test-reports > docs/codebase/repository-directory-structure.md
> ```

## Directory Tree
🌳 Directory Structure: .

└── corso-code
    ├── .clerk
    │   ├── .tmp
    │   │   ├── keyless.json
    │   │   ├── README.md
    │   │   ├── telemetry.json
    ├── .cursor
    │   ├── implementation-plan
    │   │   ├── comprehensive-dashboard-chat-todos.md
    │   │   ├── cursor-rules-audit-qa-validation.md
    │   │   ├── cursor-rules-audit-qa.md
    │   ├── rules
    │   │   ├── templates
    │   │   │   ├── rule-templates.mdc
    │   │   ├── `_index.json`
    │   │   ├── `_snippets.mdc`
    │   │   ├── actions-rate-limit-check.mdc
    │   │   ├── ai-agent-development-environment.mdc
    │   │   ├── analytics-tracking.mdc
    │   │   ├── code-quality-standards.mdc
    │   │   ├── component-design-system.mdc
    │   │   ├── corso-assistant.mdc
    │   │   ├── corso-dev.md
    │   │   ├── dashboard-components.mdc
    │   │   ├── documentation-standards.mdc
    │   │   ├── duplicate-action-validation.mdc
    │   │   ├── entity-grid-architecture.mdc
    │   │   ├── file-organization.mdc
    │   │   ├── openapi-vendor-extensions.mdc
    │   │   ├── README.md
    │   │   ├── runtime-boundaries.mdc
    │   │   ├── security-standards.mdc
    │   │   ├── warehouse-query-hooks.mdc
    │   ├── bash-init.sh
    │   ├── bash-wrapper.sh
    ├── .husky
    │   ├── `_`
    │   │   ├── husky.sh
    │   ├── commit-msg
    │   ├── husky.sh
    │   ├── post-checkout
    │   ├── post-commit
    │   ├── post-merge
    │   ├── pre-commit
    │   ├── pre-push
    │   ├── pre-rebase
    │   ├── README.md
    ├── .vscode
    │   ├── extensions.json
    │   ├── keybindings.json
    │   ├── launch.json
    │   ├── README.md
    │   ├── settings.json
    │   ├── tasks.json
    ├── api
    │   ├── openapi.base.json
    │   ├── openapi.json
    │   ├── openapi.yml
    │   ├── README.md
    ├── app
    │   ├── (auth)
    │   │   ├── sign-in
    │   │   │   ├── [[...sign-in]]
    │   │   │   │   ├── page.tsx
    │   │   ├── sign-up
    │   │   │   ├── [[...sign-up]]
    │   │   │   │   ├── page.tsx
    │   │   ├── `_theme.tsx`
    │   │   ├── error.tsx
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── README.md
    │   ├── (marketing)
    │   │   ├── contact
    │   │   │   ├── actions.ts
    │   │   │   ├── page.tsx
    │   │   ├── cookies
    │   │   │   ├── page.tsx
    │   │   ├── insights
    │   │   │   ├── [slug]
    │   │   │   │   ├── not-found.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   ├── categories
    │   │   │   │   ├── [category]
    │   │   │   │   │   ├── page.tsx
    │   │   │   ├── rss
    │   │   │   │   ├── route.ts
    │   │   │   ├── page.tsx
    │   │   ├── legal
    │   │   │   ├── page.tsx
    │   │   ├── pricing
    │   │   │   ├── page.tsx
    │   │   │   ├── scroll-to-faq.tsx
    │   │   ├── privacy
    │   │   │   ├── page.tsx
    │   │   ├── terms
    │   │   │   ├── page.tsx
    │   │   ├── `_theme.tsx`
    │   │   ├── error.tsx
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── page.tsx
    │   │   ├── README.md
    │   ├── (protected)
    │   │   ├── dashboard
    │   │   │   ├── (entities)
    │   │   │   │   ├── [entity]
    │   │   │   │   │   ├── page.tsx
    │   │   │   ├── account
    │   │   │   │   ├── layout.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   │   ├── user-profile-client.tsx
    │   │   │   ├── chat
    │   │   │   │   ├── page.tsx
    │   │   │   ├── subscription
    │   │   │   │   ├── layout.tsx
    │   │   │   │   ├── page.tsx
    │   │   │   ├── error.tsx
    │   │   │   ├── layout.tsx
    │   │   │   ├── page.tsx
    │   │   │   ├── README.md
    │   │   ├── client.tsx
    │   │   ├── error.tsx
    │   │   ├── layout.tsx
    │   │   ├── loading.tsx
    │   │   ├── README.md
    │   ├── api
    │   │   ├── health
    │   │   │   ├── clickhouse
    │   │   │   │   ├── route.ts
    │   │   │   ├── README.md
    │   │   │   ├── route.ts
    │   │   ├── internal
    │   │   │   ├── auth
    │   │   │   │   ├── route.ts
    │   │   │   ├── README.md
    │   │   ├── public
    │   │   │   ├── health
    │   │   │   │   ├── clickhouse
    │   │   │   │   │   ├── route.ts
    │   │   │   │   ├── route.ts
    │   │   ├── v1
    │   │   │   ├── ai
    │   │   │   │   ├── chat
    │   │   │   │   │   ├── route.ts
    │   │   │   │   ├── generate-sql
    │   │   │   │   │   ├── route.ts
    │   │   │   ├── csp-report
    │   │   │   │   ├── route.ts
    │   │   │   ├── entity
    │   │   │   │   ├── [entity]
    │   │   │   │   │   ├── export
    │   │   │   │   │   │   ├── route.ts
    │   │   │   │   │   ├── query
    │   │   │   │   │   │   ├── route.ts
    │   │   │   │   │   ├── route.ts
    │   │   │   ├── insights
    │   │   │   │   ├── search
    │   │   │   │   │   ├── route.ts
    │   │   │   ├── query
    │   │   │   │   ├── route.ts
    │   │   │   ├── user
    │   │   │   │   ├── route.ts
    │   │   │   ├── README.md
    │   │   ├── README.md
    │   ├── providers
    │   │   ├── route-theme-provider.tsx
    │   ├── global-error.tsx
    │   ├── layout.tsx
    │   ├── not-found.tsx
    │   ├── providers.tsx
    │   ├── README.md
    │   ├── sitemap.ts
    ├── components
    │   ├── auth
    │   │   ├── internal
    │   │   │   ├── index.ts
    │   │   ├── layout
    │   │   │   ├── auth-navbar.tsx
    │   │   │   ├── auth-shell.tsx
    │   │   │   ├── clerk-loading.tsx
    │   │   ├── widgets
    │   │   │   ├── clerk-events-handler.tsx
    │   │   ├── clerk-script-loader.tsx
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── billing
    │   │   ├── index.ts
    │   │   ├── README.md
    │   │   ├── subscription-client.tsx
    │   ├── chat
    │   │   ├── hooks
    │   │   │   ├── use-chat.ts
    │   │   ├── sections
    │   │   │   ├── chat-composer.tsx
    │   │   │   ├── chat-page.tsx
    │   │   │   ├── chat-window.tsx
    │   │   ├── utils
    │   │   │   ├── time-utils.ts
    │   │   ├── widgets
    │   │   │   ├── chat-table.tsx
    │   │   │   ├── chat-welcome.tsx
    │   │   │   ├── follow-up-chips.tsx
    │   │   │   ├── message-item.tsx
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── dashboard
    │   │   ├── entities
    │   │   │   ├── addresses
    │   │   │   │   ├── config.ts
    │   │   │   │   ├── README.md
    │   │   │   ├── companies
    │   │   │   │   ├── config.ts
    │   │   │   │   ├── README.md
    │   │   │   ├── projects
    │   │   │   │   ├── config.ts
    │   │   │   │   ├── README.md
    │   │   │   ├── shared
    │   │   │   │   ├── grid
    │   │   │   │   │   ├── entity-grid-host.tsx
    │   │   │   │   │   ├── entity-grid.tsx
    │   │   │   │   │   ├── fetchers.ts
    │   │   │   │   │   ├── grid-menubar.tsx
    │   │   │   │   ├── renderers
    │   │   │   │   │   ├── README.md
    │   │   │   │   │   ├── value-formatter.ts
    │   │   │   │   ├── ag-grid-config.ts
    │   │   │   │   ├── README.md
    │   │   │   ├── index.ts
    │   │   │   ├── README.md
    │   │   ├── header
    │   │   │   ├── dashboard-header.tsx
    │   │   ├── layout
    │   │   │   ├── dashboard-layout.tsx
    │   │   │   ├── dashboard-nav.tsx
    │   │   │   ├── dashboard-sidebar.tsx
    │   │   │   ├── dashboard-top-bar.tsx
    │   │   │   ├── README.md
    │   │   ├── sidebar
    │   │   │   ├── README.md
    │   │   │   ├── sidebar-context.tsx
    │   │   │   ├── sidebar-item.tsx
    │   │   │   ├── sidebar-root.tsx
    │   │   │   ├── sidebar-tooltip-layer.tsx
    │   │   │   ├── sidebar-tooltip.tsx
    │   │   │   ├── sidebar-top.tsx
    │   │   │   ├── sidebar-user-profile.tsx
    │   │   │   ├── sidebar.module.css
    │   │   ├── corso-ai-mode.tsx
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── forms
    │   │   ├── contact
    │   │   │   ├── contact-form.tsx
    │   │   │   ├── use-contact-form.ts
    │   │   ├── primitives
    │   │   │   ├── field-base.tsx
    │   │   │   ├── field-renderer.tsx
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── insights
    │   │   ├── hooks
    │   │   │   ├── use-article-analytics.ts
    │   │   ├── layout
    │   │   │   ├── insights-section.tsx
    │   │   │   ├── nav.config.ts
    │   │   │   ├── navbar.tsx
    │   │   │   ├── README.md
    │   │   ├── sections
    │   │   │   ├── insight-detail.tsx
    │   │   │   ├── insights-list.tsx
    │   │   ├── widgets
    │   │   │   ├── article-header.tsx
    │   │   │   ├── article-image.tsx
    │   │   │   ├── article-metadata.tsx
    │   │   │   ├── related-articles.tsx
    │   │   │   ├── table-of-contents.tsx
    │   │   ├── category-filter.tsx
    │   │   ├── constants.ts
    │   │   ├── index.ts
    │   │   ├── insight-card.tsx
    │   │   ├── insights-client.tsx
    │   │   ├── insights-hero.tsx
    │   │   ├── README.md
    │   │   ├── types.ts
    │   ├── landing
    │   │   ├── hooks
    │   │   │   ├── use-animated-number.ts
    │   │   ├── layout
    │   │   │   ├── landing-section.tsx
    │   │   │   ├── nav.config.ts
    │   │   │   ├── README.md
    │   │   ├── sections
    │   │   │   ├── hero
    │   │   │   │   ├── hero.module.css
    │   │   │   │   ├── hero.tsx
    │   │   │   ├── market-insights
    │   │   │   │   ├── chart-data.ts
    │   │   │   │   ├── market-insights-lazy.tsx
    │   │   │   │   ├── market-insights-section.tsx
    │   │   │   │   ├── market-insights.module.css
    │   │   │   │   ├── README.md
    │   │   │   ├── product-showcase
    │   │   │   │   ├── product-showcase.tsx
    │   │   │   ├── roi
    │   │   │   │   ├── README.md
    │   │   │   │   ├── roi-calculator.tsx
    │   │   │   │   ├── roi-output-panel.tsx
    │   │   │   │   ├── roi.module.css
    │   │   │   ├── use-cases
    │   │   │   │   ├── industry-selector-panel.tsx
    │   │   │   │   ├── use-case-explorer.tsx
    │   │   │   │   ├── use-cases.data.ts
    │   │   │   ├── README.md
    │   │   ├── utils
    │   │   │   ├── data.ts
    │   │   ├── widgets
    │   │   │   ├── animated-pill
    │   │   │   │   ├── animated-pill.css
    │   │   │   │   ├── animated-pill.tsx
    │   │   │   │   ├── index.ts
    │   │   │   ├── animated-number.tsx
    │   │   │   ├── chart.tsx
    │   │   │   ├── filter-pills.tsx
    │   │   │   ├── filter-select.tsx
    │   │   │   ├── number-input-with-steppers.tsx
    │   │   │   ├── pill-group.tsx
    │   │   │   ├── README.md
    │   │   │   ├── statistics.tsx
    │   │   │   ├── use-number-input.ts
    │   │   │   ├── year-range-slider.tsx
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── marketing
    │   │   ├── layout
    │   │   │   ├── marketing-container.tsx
    │   │   ├── pricing
    │   │   │   ├── plan-ui.ts
    │   │   ├── sections
    │   │   │   ├── contact
    │   │   │   │   ├── contact-form-wrapper.tsx
    │   │   │   │   ├── contact-info.tsx
    │   │   │   │   ├── contact-item.tsx
    │   │   │   │   ├── contact-layout.tsx
    │   │   │   │   ├── README.md
    │   │   │   ├── legal
    │   │   │   │   ├── cookies-content.tsx
    │   │   │   │   ├── legal-content-wrapper.tsx
    │   │   │   │   ├── legal-page-section.tsx
    │   │   │   │   ├── legal-section.tsx
    │   │   │   │   ├── privacy-content.tsx
    │   │   │   │   ├── README.md
    │   │   │   │   ├── terms-content.tsx
    │   │   │   ├── pricing
    │   │   │   │   ├── pricing-faq.tsx
    │   │   │   │   ├── pricing-header.tsx
    │   │   │   │   ├── pricing-page.tsx
    │   │   │   │   ├── README.md
    │   │   │   │   ├── types.ts
    │   │   │   ├── README.md
    │   │   ├── widgets
    │   │   │   ├── animated-lightning-icon.tsx
    │   │   │   ├── faq-section-frame.tsx
    │   │   │   ├── README.md
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── ui
    │   │   ├── atoms
    │   │   │   ├── icon
    │   │   │   │   ├── icons
    │   │   │   │   │   ├── building-icon.tsx
    │   │   │   │   │   ├── hamburger-icon.tsx
    │   │   │   │   │   ├── index.ts
    │   │   │   │   │   ├── mail-icon.tsx
    │   │   │   │   │   ├── message-square-icon.tsx
    │   │   │   │   │   ├── up-arrow-icon.tsx
    │   │   │   │   │   ├── user-icon.tsx
    │   │   │   │   │   ├── x-mark-icon.tsx
    │   │   │   │   ├── icon-base.tsx
    │   │   │   │   ├── README.md
    │   │   │   ├── progress
    │   │   │   │   ├── progress-indicator.tsx
    │   │   │   │   ├── progress.tsx
    │   │   │   │   ├── README.md
    │   │   │   ├── badge.tsx
    │   │   │   ├── button.tsx
    │   │   │   ├── card.tsx
    │   │   │   ├── index.ts
    │   │   │   ├── input.tsx
    │   │   │   ├── label.tsx
    │   │   │   ├── link.tsx
    │   │   │   ├── logo.tsx
    │   │   │   ├── README.md
    │   │   │   ├── route-loading.tsx
    │   │   │   ├── skeleton.tsx
    │   │   │   ├── skip-nav-link.tsx
    │   │   │   ├── slider.tsx
    │   │   │   ├── spinner.tsx
    │   │   │   ├── toggle.tsx
    │   │   ├── hooks
    │   │   │   ├── use-arrow-key-navigation.ts
    │   │   │   ├── use-subscription-status.ts
    │   │   ├── molecules
    │   │   │   ├── shared
    │   │   │   │   ├── README.md
    │   │   │   │   ├── use-arrow-key-navigation.ts
    │   │   │   ├── tab-switcher
    │   │   │   │   ├── README.md
    │   │   │   │   ├── tab-button-base.tsx
    │   │   │   │   ├── tab-switcher.tsx
    │   │   │   ├── auth-card.tsx
    │   │   │   ├── index.ts
    │   │   │   ├── link-track.tsx
    │   │   │   ├── loading-states.tsx
    │   │   │   ├── metric-card.tsx
    │   │   │   ├── nav-item.tsx
    │   │   │   ├── page-header.tsx
    │   │   │   ├── pricing-card.tsx
    │   │   │   ├── reading-progress.tsx
    │   │   │   ├── README.md
    │   │   │   ├── select.tsx
    │   │   │   ├── skeleton-suite.tsx
    │   │   │   ├── text-area.tsx
    │   │   ├── organisms
    │   │   │   ├── footer-system
    │   │   │   │   ├── footer-cta.tsx
    │   │   │   │   ├── footer-legal.tsx
    │   │   │   │   ├── footer-main.tsx
    │   │   │   │   ├── footer.tsx
    │   │   │   │   ├── README.md
    │   │   │   ├── navbar
    │   │   │   │   ├── links.ts
    │   │   │   │   ├── navbar-menu.tsx
    │   │   │   │   ├── navbar.tsx
    │   │   │   │   ├── README.md
    │   │   │   │   ├── shared.tsx
    │   │   │   ├── app-error-boundary.tsx
    │   │   │   ├── error-fallback.tsx
    │   │   │   ├── faq.tsx
    │   │   │   ├── full-width-section.tsx
    │   │   │   ├── index.ts
    │   │   │   ├── public-layout.tsx
    │   │   │   ├── README.md
    │   │   │   ├── result-panel.tsx
    │   │   │   ├── site-footer-shell.tsx
    │   │   ├── patterns
    │   │   │   ├── index.ts
    │   │   │   ├── README.md
    │   │   │   ├── section-header.tsx
    │   │   │   ├── section-shell.tsx
    │   │   ├── shared
    │   │   │   ├── analytics.ts
    │   │   │   ├── index.ts
    │   │   │   ├── README.md
    │   │   ├── README.md
    │   │   ├── segmented-control.tsx
    │   ├── index.ts
    │   ├── README.md
    ├── config
    │   ├── eslint
    │   │   ├── rules
    │   ├── security
    │   │   ├── rbac-roles.json
    │   ├── typescript
    │   │   ├── README.md
    │   │   ├── tsconfig.app.json
    │   │   ├── tsconfig.base.json
    │   │   ├── tsconfig.components.json
    │   │   ├── tsconfig.eslint.json
    │   │   ├── tsconfig.json
    │   │   ├── tsconfig.lib.json
    │   │   ├── tsconfig.prod.json
    │   │   ├── tsconfig.styles.json
    │   │   ├── tsconfig.testing.json
    │   │   ├── tsconfig.tooling.json
    │   │   ├── tsconfig.types.json
    │   ├── .cspell.json
    │   ├── .dependency-cruiser.cjs
    │   ├── .markdown-link-check.json
    │   ├── .prettierrc.js
    │   ├── .stylelintrc.cjs
    │   ├── domain-map.ts
    │   ├── edge-compat.config.json
    │   ├── next.config.mjs
    │   ├── postcss.config.js
    │   ├── README.md
    │   ├── security-policy.json
    │   ├── typedoc.json
    ├── contexts
    │   ├── shared
    │   │   ├── is-development.ts
    │   ├── index.ts
    │   ├── providers.tsx
    │   ├── README.md
    ├── docs
    │   ├── accessibility
    │   │   ├── accessibility-guide.md
    │   ├── analytics
    │   │   ├── clickhouse-recommendations.md
    │   │   ├── warehouse-query-hooks.md
    │   ├── api
    │   │   ├── api-design-guide.md
    │   ├── api-data
    │   │   ├── api-patterns.md
    │   ├── architecture
    │   │   ├── actions-vs-api-routes.md
    │   │   ├── architecture-overview.md
    │   │   ├── auth.md
    │   │   ├── barrels-policy.md
    │   │   ├── request-storm-check-explained.md
    │   │   ├── runtime-boundaries.md
    │   ├── architecture-design
    │   │   ├── domain-driven-architecture.md
    │   │   ├── ui-design-guide.md
    │   ├── audits
    │   │   ├── ag-grid-implementation-audit-20250128.md
    │   │   ├── ag-grid-versions-20251012.md
    │   │   ├── dead-code-baseline-20250126.md
    │   │   ├── deprecated-files-removal-plan.md
    │   │   ├── deprecated-files-removal-summary.md
    │   │   ├── domain6-review-guide-20250115.md
    │   │   ├── generate-sql-route-test-audit-2025-12.md
    │   │   ├── lib-barrels-analysis.md
    │   │   ├── lib-cleanup-20250916.md
    │   │   ├── lib-declutter-plan.md
    │   │   ├── next-steps.md
    │   │   ├── orphan-triage-report.md
    │   │   ├── orphans-20251009-context.md
    │   │   ├── orphans-20251009.md
    │   │   ├── production-audit-20250115.md
    │   │   ├── quality-gates-summary-20251214.md
    │   │   ├── removal-summary-20251214.md
    │   │   ├── unused-css-tokens-audit.md
    │   │   ├── validation-sweep-audit-20250128.md
    │   ├── cicd-workflow
    │   │   ├── ci-pipeline.md
    │   │   ├── ci-workflows.md
    │   │   ├── cicd-enhancement-guide.md
    │   │   ├── quality-gates.md
    │   ├── codebase
    │   │   ├── `_generated`
    │   │   │   ├── app-routes.md
    │   │   ├── app-directory-structure.md
    │   │   ├── repository-directory-structure-temp.md
    │   │   ├── repository-directory-structure.md
    │   ├── codebase-apis
    │   │   ├── codebase-structure.md
    │   │   ├── import-patterns.md
    │   │   ├── warehouse-queries.md
    │   ├── content
    │   │   ├── insights-authoring-guide.md
    │   ├── contributing
    │   │   ├── unused-exports.md
    │   ├── database
    │   │   ├── audit-log-retention-policy.md
    │   │   ├── backup-and-recovery.md
    │   │   ├── clickhouse-hardening.md
    │   │   ├── materialized-view-refresh-strategy.md
    │   │   ├── performance-monitoring.md
    │   ├── decisions
    │   │   ├── route-theme-duplication.md
    │   ├── dependencies
    │   │   ├── dependency-management-guide.md
    │   │   ├── maintenance-plan.md
    │   ├── development
    │   │   ├── coding-standards.md
    │   │   ├── dashboard-auth-verification.md
    │   │   ├── dashboard-setup.md
    │   │   ├── eslint-runtime-boundaries.md
    │   │   ├── route-config.md
    │   │   ├── setup-guide.md
    │   ├── error-handling
    │   │   ├── error-handling-guide.md
    │   ├── examples
    │   │   ├── dashboard
    │   ├── feature-notes
    │   │   ├── global-quick-search-design-sprint-8.md
    │   │   ├── pricing-page-implementation-summary.md
    │   ├── maintenance
    │   │   ├── unused-exports
    │   │   │   ├── baseline.json
    │   │   ├── config-audit-sprint3-findings.md
    │   │   ├── CONSOLIDATION_SUMMARY.md
    │   │   ├── data-layer-hardening-summary.md
    │   │   ├── dead-code-batch2-summary.md
    │   │   ├── dead-code-batch3-summary.md
    │   │   ├── dead-code-sprint-complete.md
    │   │   ├── dead-code.md
    │   │   ├── deprecation-warning-audit.md
    │   │   ├── HIGH_PRIORITY_IMPLEMENTATION.md
    │   │   ├── MAINTENANCE_AUDIT_IMPLEMENTATION.md
    │   │   ├── p1-polish-summary.md
    │   │   ├── refactor-implementation-plan.md
    │   │   ├── REMAINING_ACTION_ITEMS_SUMMARY.md
    │   │   ├── REMAINING_ACTION_ITEMS.md
    │   ├── monitoring
    │   │   ├── monitoring-guide.md
    │   ├── operations
    │   │   ├── operational-guide.md
    │   ├── performance
    │   │   ├── performance-optimization-guide.md
    │   ├── production
    │   │   ├── production-readiness-checklist.md
    │   ├── qa
    │   │   ├── manual-verification-guide.md
    │   │   ├── pricing-page-qa-checklist.md
    │   │   ├── README.md
    │   │   ├── verification-steps.md
    │   │   ├── verification-summary.md
    │   ├── reference
    │   │   ├── edge-runtime.md
    │   ├── references
    │   │   ├── api-specification.md
    │   │   ├── deps.md
    │   │   ├── env.md
    │   │   ├── spectral.example.yaml
    │   ├── review
    │   ├── security
    │   │   ├── auth-patterns.md
    │   │   ├── dependency-policy.md
    │   │   ├── README.md
    │   │   ├── security-implementation.md
    │   │   ├── security-policy.md
    │   ├── testing-quality
    │   │   ├── testing-guide.md
    │   │   ├── testing-strategy.md
    │   ├── tools-scripts
    │   │   ├── development-tools.md
    │   ├── typescript
    │   │   ├── type-safety-audit.md
    │   │   ├── typescript-guide.md
    │   ├── ui
    │   │   ├── table.md
    │   ├── upgrades
    │   │   ├── nextjs-16-upgrade-guide.md
    │   ├── .markdownlintrc
    │   ├── best-practices.md
    │   ├── guardrails.json
    │   ├── index.ts
    │   ├── pattern-library.md
    │   ├── README.md
    │   ├── repo-root-policy.md
    ├── eslint-plugin-corso
    │   ├── rules
    │   │   ├── domain-config.json
    │   ├── scripts
    │   │   ├── build.mjs
    │   ├── src
    │   │   ├── index.js
    │   ├── guardrails.json
    │   ├── package.json
    │   ├── README.md
    ├── hooks
    │   ├── shared
    │   │   ├── ui
    │   │   │   ├── use-arrow-key-navigation.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── README.md
    ├── lib
    │   ├── actions
    │   │   ├── error-handling.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   │   ├── validation.ts
    │   ├── api
    │   │   ├── response
    │   │   │   ├── api-error.ts
    │   │   │   ├── http.ts
    │   │   ├── shared
    │   │   │   ├── edge-route.ts
    │   │   ├── client.ts
    │   │   ├── data.ts
    │   │   ├── edge.ts
    │   │   ├── index.ts
    │   │   ├── mock-normalizers.ts
    │   │   ├── README.md
    │   ├── auth
    │   │   ├── authorization
    │   │   │   ├── roles.ts
    │   │   ├── clerk-appearance.ts
    │   │   ├── client.ts
    │   │   ├── README.md
    │   │   ├── server.ts
    │   ├── chat
    │   │   ├── client
    │   │   │   ├── process.ts
    │   │   ├── query
    │   │   │   ├── intent-detection.ts
    │   │   ├── rag-context
    │   │   │   ├── history-client.ts
    │   │   ├── types
    │   │   │   ├── client-safe.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── core
    │   │   ├── client.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── dashboard
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── integrations
    │   │   ├── clickhouse
    │   │   │   ├── client.ts
    │   │   │   ├── entity-query.server.ts
    │   │   │   ├── index.ts
    │   │   │   ├── security.ts
    │   │   │   ├── server.ts
    │   │   │   ├── utils.ts
    │   │   ├── database
    │   │   │   ├── scope.ts
    │   │   ├── env
    │   │   │   ├── index.ts
    │   │   ├── openai
    │   │   │   ├── server.ts
    │   │   ├── supabase
    │   │   │   ├── server.ts
    │   │   ├── README.md
    │   ├── marketing
    │   │   ├── insights
    │   │   │   ├── content-service.ts
    │   │   │   ├── directus-adapter.ts
    │   │   │   ├── image-resolver.ts
    │   │   │   ├── legacy-adapter.ts
    │   │   │   ├── mockcms-adapter.ts
    │   │   │   ├── source.ts
    │   │   │   ├── static-data.ts
    │   │   ├── client.ts
    │   │   ├── README.md
    │   │   ├── roi.ts
    │   │   ├── server.ts
    │   │   ├── use-cases.ts
    │   ├── middleware
    │   │   ├── edge
    │   │   │   ├── error-handler.ts
    │   │   │   ├── rate-limit.ts
    │   │   ├── http
    │   │   │   ├── cors.ts
    │   │   │   ├── headers.ts
    │   │   │   ├── rate-limit.ts
    │   │   │   ├── request-id.ts
    │   │   │   ├── with-error-handling-node.ts
    │   │   │   ├── with-rate-limit-node.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── mocks
    │   │   ├── mappers
    │   │   │   ├── projects.adapter.ts
    │   │   ├── index.ts
    │   │   ├── shared.ts
    │   ├── monitoring
    │   │   ├── core
    │   │   │   ├── base-logger.ts
    │   │   │   ├── logger-edge.ts
    │   │   │   ├── logger.ts
    │   │   │   ├── metrics.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── ratelimiting
    │   │   ├── adapters
    │   │   │   ├── memory.ts
    │   │   │   ├── redis.ts
    │   │   ├── algorithms
    │   │   │   ├── fixed-window.ts
    │   │   ├── domains
    │   │   │   ├── actions.ts
    │   │   ├── core.ts
    │   │   ├── index.ts
    │   │   ├── key.ts
    │   │   ├── README.md
    │   │   ├── server.ts
    │   │   ├── store.ts
    │   │   ├── types.ts
    │   ├── security
    │   │   ├── utils
    │   │   │   ├── masking.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   │   ├── server.ts
    │   │   ├── turnstile.server.ts
    │   ├── server
    │   │   ├── db
    │   │   │   ├── index.ts
    │   │   │   ├── supabase-tenant-client.ts
    │   │   │   ├── tenant-context.ts
    │   │   ├── env
    │   │   │   ├── knobs.ts
    │   │   ├── errors
    │   │   │   ├── error-utils.ts
    │   │   ├── feature-flags
    │   │   │   ├── builder.ts
    │   │   │   ├── feature-flags.ts
    │   │   │   ├── resolvers.ts
    │   │   ├── shared
    │   │   │   ├── validation
    │   │   │   │   ├── domain-configs.ts
    │   │   │   ├── query-utils.ts
    │   │   │   ├── server.ts
    │   │   ├── env.ts
    │   │   ├── index.ts
    │   │   ├── README.md
    │   │   ├── runtime.ts
    │   ├── services
    │   │   ├── entities
    │   │   │   ├── adapters
    │   │   │   │   ├── aggrid-formatters.tsx
    │   │   │   │   ├── aggrid.ts
    │   │   │   ├── addresses
    │   │   │   │   ├── columns.config.ts
    │   │   │   │   ├── gridmap.config.ts
    │   │   │   ├── columns
    │   │   │   │   ├── registry.ts
    │   │   │   ├── companies
    │   │   │   │   ├── columns.config.ts
    │   │   │   │   ├── gridmap.config.ts
    │   │   │   ├── projects
    │   │   │   │   ├── columns.config.ts
    │   │   │   │   ├── gridmap.config.ts
    │   │   │   ├── actions.ts
    │   │   │   ├── config.ts
    │   │   │   ├── contracts.ts
    │   │   │   ├── pages.ts
    │   │   │   ├── README.md
    │   │   │   ├── registry.ts
    │   │   │   ├── search-fields.ts
    │   │   │   ├── types.ts
    │   │   ├── index.ts
    │   ├── shared
    │   │   ├── analytics
    │   │   │   ├── track.ts
    │   │   ├── assets
    │   │   │   ├── cdn.ts
    │   │   ├── cache
    │   │   │   ├── index.ts
    │   │   │   ├── lru-cache.ts
    │   │   │   ├── simple-cache.ts
    │   │   ├── config
    │   │   │   ├── auth-mode.ts
    │   │   │   ├── client.ts
    │   │   ├── constants
    │   │   │   ├── links.ts
    │   │   ├── errors
    │   │   │   ├── api-error-conversion.ts
    │   │   │   ├── application-error.ts
    │   │   │   ├── browser.ts
    │   │   │   ├── error-utils.ts
    │   │   │   ├── reporting.ts
    │   │   │   ├── security-validation-error.ts
    │   │   │   ├── types.ts
    │   │   │   ├── validation-error.ts
    │   │   ├── feature-flags
    │   │   │   ├── core.ts
    │   │   │   ├── feature-flags.ts
    │   │   ├── format
    │   │   │   ├── numbers.ts
    │   │   ├── validation
    │   │   │   ├── assert.ts
    │   │   │   ├── README.md
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── validators
    │   │   ├── auth
    │   │   │   ├── user-validation.ts
    │   │   ├── dashboard
    │   │   │   ├── warehouse-entity-validation.ts
    │   │   ├── security
    │   │   │   ├── chat-validation.ts
    │   │   │   ├── csp.ts
    │   │   ├── shared
    │   │   │   ├── primitives.ts
    │   │   ├── clerk-webhook.ts
    │   │   ├── contact.ts
    │   │   ├── entity.ts
    │   │   ├── entityListQuery.ts
    │   │   ├── entityQuery.ts
    │   │   ├── index.ts
    │   │   ├── mock-projects.ts
    │   │   ├── README.md
    │   ├── vendors
    │   │   ├── ag-grid.client.ts
    │   │   ├── ag-grid.theme.ts
    │   ├── log.ts
    │   ├── README.md
    ├── public
    │   ├── `__mockcms__`
    │   │   ├── categories
    │   │   │   ├── index.json
    │   │   ├── insights
    │   │   │   ├── breaking-down-data-silos.json
    │   │   │   ├── construction-forecasting-integrating-schedule-cost.json
    │   │   │   ├── construction-market-outlook-2026.json
    │   │   │   ├── controlling-cost-overruns-predictive-analytics.json
    │   │   │   ├── data-driven-culture-best-practices.json
    │   │   │   ├── data-driven-decision-making-jobsite.json
    │   │   │   ├── future-of-project-controls-ai-platforms.json
    │   │   │   ├── harnessing-field-data-project-operations.json
    │   │   │   ├── human-side-construction-tech.json
    │   │   │   ├── index.json
    │   │   │   ├── leading-indicators-construction-safety.json
    │   │   │   ├── managing-change-orders-agile-project-controls.json
    │   │   │   ├── predictive-maintenance-construction-equipment.json
    │   │   │   ├── resilient-construction-strategies.json
    │   │   │   ├── rise-of-ai-iot-construction.json
    │   │   │   ├── roi-of-safety-proactive-programs.json
    │   │   │   ├── streamlining-procurement-digital-tools.json
    │   │   │   ├── sustainable-construction-2030.json
    │   │   │   ├── sustainable-materials-cost-balance.json
    │   │   ├── `_meta.json`
    │   ├── `__mockdb__`
    │   │   ├── addresses.json
    │   │   ├── companies.json
    │   │   ├── projects.json
    │   ├── demos
    │   │   ├── addresses-interface.png
    │   │   ├── companies-interface.png
    │   │   ├── corso-ai-interface.png
    │   │   ├── projects-interface.png
    │   ├── insights
    │   │   ├── insights-construction-trends.png
    │   ├── favicon.ico
    │   ├── logo-dog.svg
    │   ├── logo.svg
    │   ├── mockServiceWorker.js
    │   ├── README.md
    │   ├── robots.txt
    ├── scripts
    │   ├── analysis
    │   │   ├── data
    │   │   │   ├── styles-keep-allowlist.json
    │   │   ├── analyze-knip-baseline.cjs
    │   │   ├── analyze-unused-exports.cjs
    │   │   ├── analyze-unused-files.cjs
    │   │   ├── categorize-unused-exports.mts
    │   │   ├── filter-orphans-high-signal.ts
    │   │   ├── generate-agent-index.ts
    │   │   ├── orphans.allowlist.txt
    │   │   ├── purge-styles.ts
    │   │   ├── README.md
    │   │   ├── scan-atoms-usage.ts
    │   │   ├── scan-styles-usage.ts
    │   │   ├── scan-ui-usage.ts
    │   │   ├── styles-keep-allowlist.ts
    │   │   ├── trim-atoms-barrel.ts
    │   │   ├── trim-exports-declaration.ts
    │   │   ├── trim-organisms-barrel.ts
    │   │   ├── trim-shared-types.ts
    │   │   ├── trim-styles-barrel.ts
    │   │   ├── trim-ui-barrels.ts
    │   ├── audit
    │   │   ├── orphans.allowlist.json
    │   │   ├── orphans.ts
    │   │   ├── README.md
    │   ├── audit-lib
    │   │   ├── cross-domain-leaves.ts
    │   │   ├── duplication-merge.ts
    │   │   ├── orphan-utils.ts
    │   ├── ci
    │   │   ├── assert-no-shared-component-variants.ts
    │   │   ├── bundle-size.config.json
    │   │   ├── check-bundle-size.ts
    │   │   ├── check-common.ts
    │   │   ├── check-deprecated-paths.ts
    │   │   ├── check-metadata.ts
    │   │   ├── check-no-top-actions.ts
    │   │   ├── check-placeholder-directories.ts
    │   │   ├── check-protected-auth.ts
    │   │   ├── check-temp-directories.ts
    │   │   ├── cleanup-branches.ts
    │   │   ├── ensure-api-in-v1-or-internal.ts
    │   │   ├── generate-bundle-report.ts
    │   │   ├── quality-gates-local.ts
    │   │   ├── README.md
    │   │   ├── validate-cursor-rules.ts
    │   │   ├── workflows-consistency-report.mjs
    │   ├── codemods
    │   │   ├── align-client-logger.mjs
    │   │   ├── codemod-common.ts
    │   │   ├── env-transformation-common.ts
    │   │   ├── file-discovery.ts
    │   │   ├── fix-intradomain-barrels.ts
    │   │   ├── README.md
    │   │   ├── refactor-constants-barrel.ts
    │   │   ├── resolve-shared-symbol-imports.ts
    │   │   ├── ts-project.ts
    │   ├── docs
    │   │   ├── templates
    │   │   │   ├── README.scripts.hbs
    │   │   ├── check-docs-idempotent.mjs
    │   │   ├── freshen.ts
    │   │   ├── gen-route-tree.ts
    │   │   ├── README.md
    │   ├── lint
    │   │   ├── ast-grep-validate.mjs
    │   │   ├── audit-ai-security.ts
    │   │   ├── audit-breakpoints.ts
    │   │   ├── audit-workflow-secrets.ts
    │   │   ├── check-css-paths.ts
    │   │   ├── check-deprecations-util-extend.ts
    │   │   ├── check-edge-compat.ts
    │   │   ├── check-forbidden-files.ts
    │   │   ├── check-lockfile-major.ts
    │   │   ├── check-metadata-viewport.ts
    │   │   ├── check-package-scripts.ts
    │   │   ├── check-pages-runtime.ts
    │   │   ├── check-readmes.ts
    │   │   ├── check-route-theme-overrides.ts
    │   │   ├── check-runtime-versions.ts
    │   │   ├── check-token-tailwind-contract.ts
    │   │   ├── check-workflows-pnpm.mjs
    │   │   ├── checkFilenameCase.ts
    │   │   ├── contrast-check.ts
    │   │   ├── css-size-analyzer.ts
    │   │   ├── deprecations-util-extend.allowlist.json
    │   │   ├── fix-eslint-plugin-dts.ts
    │   │   ├── forbid-scripts-barrels.ts
    │   │   ├── no-binary-fonts.ts
    │   │   ├── no-deprecated-imports.ts
    │   │   ├── README.md
    │   │   ├── token-syntax-audit.ts
    │   │   ├── validate-effect-deps.ts
    │   │   ├── validate-package-json.ts
    │   │   ├── verify-ai-tools.ts
    │   │   ├── verify-eslint-plugin-dts.ts
    │   │   ├── verify-no-dts-transform.ts
    │   ├── maintenance
    │   │   ├── `_utils`
    │   │   │   ├── `__tests__`
    │   │   │   │   ├── guards.test.ts
    │   │   │   ├── concurrency.ts
    │   │   │   ├── frontmatter.ts
    │   │   │   ├── globs.ts
    │   │   │   ├── guards.ts
    │   │   │   ├── run-local-bin.ts
    │   │   ├── barrels
    │   │   │   ├── policy-check.ts
    │   │   ├── boundaries
    │   │   │   ├── check-cross-boundary.ts
    │   │   │   ├── check-deep-imports.ts
    │   │   ├── codemods
    │   │   │   ├── replace-server-to-integrations.ts
    │   │   ├── docs
    │   │   │   ├── `__tests__`
    │   │   │   │   ├── basic.test.ts
    │   │   │   │   ├── cli.test.ts
    │   │   │   │   ├── frontmatter.test.ts
    │   │   │   │   ├── frontmatter.unified.test.ts
    │   │   │   │   ├── helpers.ts
    │   │   │   ├── lib
    │   │   │   │   ├── frontmatter.ts
    │   │   │   │   ├── fs.ts
    │   │   │   │   ├── links.ts
    │   │   │   │   ├── markdown.ts
    │   │   │   ├── tasks
    │   │   │   │   ├── enhance.ts
    │   │   │   │   ├── generate.ts
    │   │   │   │   ├── normalize.ts
    │   │   │   ├── cli.ts
    │   │   │   ├── constants.ts
    │   │   │   ├── generate-readmes.ts
    │   │   │   ├── types.ts
    │   │   ├── zod
    │   │   │   ├── strict-audit.ts
    │   │   ├── audit-barrels.ts
    │   │   ├── audit-unused-tokens.ts
    │   │   ├── autofix-doc-links.js
    │   │   ├── barrel.config.ts
    │   │   ├── check-barrels.ts
    │   │   ├── check-readme-freshness.ts
    │   │   ├── clean-next-build.ts
    │   │   ├── clean-typescript-cache.ts
    │   │   ├── cleanup-cursor.ts
    │   │   ├── docs-patterns-common.ts
    │   │   ├── enhance-readmes.ts
    │   │   ├── ensure-ports.ps1
    │   │   ├── ensure-ports.ts
    │   │   ├── extract-docs-rules.ts
    │   │   ├── find-test-only-exports.ts
    │   │   ├── fix-barrel-exports-all.ts
    │   │   ├── fix-links.ts
    │   │   ├── gen-variants-index.ts
    │   │   ├── generate-alias-doc.ts
    │   │   ├── generate-readme.ts
    │   │   ├── inject-frontmatter.ts
    │   │   ├── kill-orphans.ps1
    │   │   ├── kill-orphans.ts
    │   │   ├── link-fixes.config.ts
    │   │   ├── list-missing-frontmatter.ts
    │   │   ├── maintenance-common.ts
    │   │   ├── manage-docs.ts
    │   │   ├── normalize-doc-status.ts
    │   │   ├── normalize-frontmatter.ts
    │   │   ├── port-static-insights-to-mockcms.ts
    │   │   ├── README.md
    │   │   ├── refresh-readmes.ts
    │   │   ├── replace-package-script-references.ts
    │   │   ├── stale-docs.ts
    │   │   ├── styles-comprehensive-audit.ts
    │   │   ├── sync-rules.mts
    │   │   ├── types-exports-audit.ts
    │   │   ├── validate-dead-code-optimized.ts
    │   │   ├── validate-docs-on-commit.ts
    │   │   ├── validate-docs.ts
    │   │   ├── validate-mock-schema.ts
    │   ├── openapi
    │   │   ├── openapi-diff.mjs
    │   │   ├── openapi-guard-rbac.ts
    │   ├── policies
    │   │   ├── import-baseline.json
    │   ├── rules
    │   │   ├── ast-grep
    │   │   │   ├── dashboard
    │   │   │   │   ├── no-client-import-server-barrel.yml
    │   │   │   │   ├── no-literal-entity-keys.yml
    │   │   │   ├── hardening
    │   │   │   │   ├── no-api-test-routes.yml
    │   │   │   ├── patterns
    │   │   │   │   ├── no-server-only-in-pages.yml
    │   │   │   ├── runtime-boundaries
    │   │   │   │   ├── ban-server-imports-in-app.yml
    │   │   │   │   ├── forbid-at-alias-in-rules.yml
    │   │   │   ├── ag-grid-no-direct-registration.yml
    │   │   │   ├── consolidated-forbid-server-only-in-shared.yml
    │   │   │   ├── consolidated-no-direct-clickhouse-import-outside-integration.yml
    │   │   │   ├── env-no-process-env.yml
    │   │   │   ├── forbid-shared-deep-imports.yml
    │   │   │   ├── no-server-imports-in-client-code.yml
    │   │   │   ├── no-server-reexport-in-shared-barrels.yml
    │   │   │   ├── README.md
    │   │   │   ├── routes-config-hardening.yml
    │   │   │   ├── ui-no-any.yml
    │   │   ├── lib
    │   │   │   ├── build-index.ts
    │   │   ├── build-index.ts
    │   │   ├── README.md
    │   ├── scaffold
    │   │   ├── domain.ts
    │   ├── setup
    │   │   ├── env-check.ts
    │   │   ├── fix-windows-pnpm.ps1
    │   │   ├── install-gitleaks.ts
    │   │   ├── README.md
    │   │   ├── setup-branch.ts
    │   │   ├── setup-docs-environment.ts
    │   │   ├── validate-ai-agent-environment.ts
    │   │   ├── validate-atomic-design.ts
    │   │   ├── validate-env.ts
    │   ├── temp
    │   ├── test
    │   │   ├── README.md
    │   ├── utils
    │   │   ├── `__tests__`
    │   │   │   ├── env-validation.test.ts
    │   │   │   ├── surfaces.test.ts
    │   │   ├── `_tools`
    │   │   ├── env
    │   │   │   ├── patterns.ts
    │   │   │   ├── validation.ts
    │   │   ├── frontmatter
    │   │   │   ├── parsing.ts
    │   │   │   ├── validation.ts
    │   │   │   ├── writing.ts
    │   │   ├── fs
    │   │   │   ├── operations.ts
    │   │   │   ├── read.ts
    │   │   │   ├── write.ts
    │   │   ├── add-barrel-docs-hints.ts
    │   │   ├── barrel-utils.ts
    │   │   ├── barrel-validation.ts
    │   │   ├── bundle-analysis-common.ts
    │   │   ├── docs-template-engine.ts
    │   │   ├── exec.ts
    │   │   ├── fix-conditional-warnings.ts
    │   │   ├── gen-type-audit.ts
    │   │   ├── jsinspect-to-sarif.ts
    │   │   ├── lastUpdated.ts
    │   │   ├── list-drop-candidates.ts
    │   │   ├── logger.ts
    │   │   ├── monitor-cursor-rules-performance.js
    │   │   ├── README.md
    │   │   ├── safe-match.ts
    │   │   ├── scan-directory.ts
    │   │   ├── script-common.ts
    │   │   ├── sync-utils-docs.ts
    │   │   ├── tools-doctor.mjs
    │   │   ├── validation-common.ts
    │   ├── validation
    │   │   ├── knip-bisect.mjs
    │   │   ├── lib-structure.ts
    │   │   ├── README.md
    │   ├── windows
    │   │   ├── download-lfs-files.ps1
    │   │   ├── install-node-pnpm.ps1
    │   │   ├── setup-dev.ps1
    │   │   ├── test-verification.ps1
    │   ├── .eslintrc.json
    │   ├── assert-no-colocated-tests.cjs
    │   ├── check-architecture-drift.ts
    │   ├── dev-workflows.bat
    │   ├── pre-commit-hook.ps1
    │   ├── README.md
    │   ├── tsconfig.json
    │   ├── verify-edge-safe.ts
    │   ├── verify-env-usage.ts
    ├── styles
    │   ├── build
    │   │   ├── components.css
    │   │   ├── globals.css
    │   │   ├── tailwind.css
    │   ├── tokens
    │   │   ├── animation.css
    │   │   ├── auth.css
    │   │   ├── border.css
    │   │   ├── colors.css
    │   │   ├── compat.css
    │   │   ├── hero.css
    │   │   ├── index.css
    │   │   ├── marketing.css
    │   │   ├── protected.css
    │   │   ├── radius.css
    │   │   ├── README.md
    │   │   ├── shadows.css
    │   │   ├── sidebar.css
    │   │   ├── spacing.css
    │   │   ├── typography.css
    │   │   ├── UNUSED.allowlist.json
    │   ├── ui
    │   │   ├── atoms
    │   │   │   ├── badge.ts
    │   │   │   ├── button-variants.ts
    │   │   │   ├── card.ts
    │   │   │   ├── checkbox.ts
    │   │   │   ├── icon.ts
    │   │   │   ├── index.ts
    │   │   │   ├── input.ts
    │   │   │   ├── label.ts
    │   │   │   ├── link-variants.ts
    │   │   │   ├── progress.ts
    │   │   │   ├── README.md
    │   │   │   ├── select.ts
    │   │   │   ├── skeleton.ts
    │   │   │   ├── skip-nav-link.ts
    │   │   │   ├── slider.ts
    │   │   │   ├── spinner-variants.ts
    │   │   │   ├── text-area.ts
    │   │   │   ├── toggle.ts
    │   │   ├── molecules
    │   │   │   ├── auth-card.ts
    │   │   │   ├── empty-state.ts
    │   │   │   ├── index.ts
    │   │   │   ├── loading-states-variants.ts
    │   │   │   ├── nav-item.ts
    │   │   │   ├── page-header.ts
    │   │   │   ├── pricing-card.ts
    │   │   │   ├── pricing-grid.ts
    │   │   │   ├── README.md
    │   │   │   ├── skeleton-suite-variants.ts
    │   │   │   ├── tab-switcher.ts
    │   │   ├── organisms
    │   │   │   ├── account-menu.ts
    │   │   │   ├── alert-dialog.ts
    │   │   │   ├── contact-form.ts
    │   │   │   ├── dashboard-shell.ts
    │   │   │   ├── faq.ts
    │   │   │   ├── file-upload.ts
    │   │   │   ├── footer-cta-variants.ts
    │   │   │   ├── footer-variants.ts
    │   │   │   ├── full-width-section.ts
    │   │   │   ├── index.ts
    │   │   │   ├── navbar-layout.ts
    │   │   │   ├── navbar-variants.ts
    │   │   │   ├── navbar.ts
    │   │   │   ├── README.md
    │   │   │   ├── result-panel.ts
    │   │   ├── patterns
    │   │   │   ├── animated-pill.css
    │   │   ├── shared
    │   │   │   ├── container-base.ts
    │   │   │   ├── container-helpers.ts
    │   │   │   ├── focus-ring.ts
    │   │   │   ├── index.ts
    │   │   │   ├── navbar-sizes.ts
    │   │   │   ├── patterns.css
    │   │   │   ├── README.md
    │   │   │   ├── surface-interactive.ts
    │   │   │   ├── typography-variants.ts
    │   │   │   ├── underline-accent.ts
    │   │   ├── ag-grid.theme.css
    │   │   ├── README.md
    │   ├── breakpoints.ts
    │   ├── fonts.ts
    │   ├── globals.css
    │   ├── index.ts
    │   ├── README.md
    │   ├── shared-variants.ts
    │   ├── tailwind.config.ts
    │   ├── utils.ts
    ├── supabase
    │   ├── .temp
    │   ├── migrations
    │   │   ├── 20240101000000_add_chat_messages_table.sql
    │   │   ├── 20240429000000_create_saved_tables.sql
    │   │   ├── 20250115000000_add_checkout_sessions_table.sql
    │   │   ├── 20250129000000_create_saved_searches_table.sql
    │   │   ├── 20250501231031_add_saved_views_table.sql
    │   │   ├── 20250502061640_add_saved_views_and_watchlists.sql
    │   │   ├── 20250503000000_add_rls_user_payment_api_keys.sql
    │   │   ├── 20250612000100_create_set_rls_context_function.sql
    │   │   ├── 20250613000100_add_clerk_webhook_events_table.sql
    │   │   ├── 202506141600_dev_metrics.sql
    │   │   ├── 20250615000001_enable_rls_all_remaining.sql
    │   │   ├── 20250615000002_idx_projects.sql
    │   │   ├── 20250615000003_audit_log.sql
    │   │   ├── 20250616000000_enable_rls_org_isolation.sql
    │   │   ├── 20250813120000_add_missing_tenant_indexes.sql
    │   │   ├── 20250813121000_mv_projects_daily_counts.sql
    │   │   ├── 20250814090000_presence_v2.sql
    │   │   ├── 20251214151602_add_missing_constraints.sql
    │   │   ├── 20251214151700_add_tenant_composite_indexes.sql
    │   │   ├── 20251214152030_materialized_view_refresh_strategy.sql
    │   │   ├── 20251214153000_query_performance_monitoring.sql
    │   │   ├── 20251214154000_audit_log_retention_policy.sql
    │   ├── ast-greprc.yml
    │   ├── config.toml
    │   ├── README.md
    ├── tests
    │   ├── actions
    │   │   ├── contact-form.test.ts
    │   ├── api
    │   │   ├── internal
    │   │   │   ├── auth.webhook.test.ts
    │   │   ├── v1
    │   │   │   ├── entity-list.relaxed.test.ts
    │   │   │   ├── entity-query.test.ts
    │   │   │   ├── entity-rate-limit.test.ts
    │   │   │   ├── insights-search.test.ts
    │   │   │   ├── subscription-status.test.ts
    │   │   │   ├── user.test.ts
    │   │   ├── api-barrel.test.ts
    │   │   ├── chat-streaming.test.ts
    │   │   ├── csp-report.cors.test.ts
    │   │   ├── entity-api.test.ts
    │   │   ├── entity.get.test.ts
    │   │   ├── export.cors.test.ts
    │   │   ├── health-clickhouse.test.ts
    │   │   ├── health.test.ts
    │   │   ├── http-helpers.test.ts
    │   │   ├── middleware-cors.test.ts
    │   │   ├── projects-query.runtime.test.ts
    │   │   ├── README-request-patterns.md
    │   │   ├── README.md
    │   ├── auth
    │   │   ├── clerk-webhook.test.ts
    │   │   ├── contact.test.ts
    │   │   ├── env-validation.test.ts
    │   │   ├── rbac-guards.unit.test.ts
    │   │   ├── runtime-boundary-sign-in.test.ts
    │   │   ├── runtime-boundary-sign-up.test.ts
    │   │   ├── sign-in.revalidate.test.ts
    │   │   ├── sign-in.runtime.test.ts
    │   │   ├── sign-up.runtime.test.ts
    │   │   ├── validators-strict.test.ts
    │   ├── chat
    │   │   ├── chat-composer.client.dom.test.tsx
    │   │   ├── chat-composer.dom.test.tsx
    │   │   ├── chat-table.dom.test.tsx
    │   │   ├── chat-window.dom.test.tsx
    │   │   ├── chat-window.hydration-boundary.dom.test.tsx
    │   │   ├── chat.route.test.ts
    │   │   ├── composer.a11y.dom.test.tsx
    │   │   ├── follow-up-chips.dom.test.tsx
    │   │   ├── generate-chart.route.test.ts
    │   │   ├── generate-sql.route.test.ts
    │   │   ├── runtime-boundary.test.ts
    │   ├── components
    │   │   ├── react-keys.test.tsx
    │   ├── core
    │   │   ├── fixtures
    │   │   │   ├── orphans
    │   │   │   │   ├── app
    │   │   │   │   │   ├── test
    │   │   │   │   │   │   ├── route.ts
    │   │   │   │   ├── docs
    │   │   │   │   │   ├── reference.md
    │   │   │   │   ├── used-barrel
    │   │   │   │   │   ├── index.ts
    │   │   │   │   │   ├── used-leaf.ts
    │   │   │   │   ├── consumer.ts
    │   │   │   │   ├── dynamic-import-consumer.ts
    │   │   │   │   ├── unused-leaf.ts
    │   │   ├── api-error-conversion.test.ts
    │   │   ├── constants-barrel.node.test.ts
    │   │   ├── constants-barrel.test.ts
    │   │   ├── import-discipline.test.ts
    │   │   ├── is-development.test.ts
    │   │   ├── lib-api-edge-safety.test.ts
    │   │   ├── lib-boundary-guards.test.ts
    │   │   ├── lib-structure-validator.test.ts
    │   │   ├── orphans-audit.test.ts
    │   │   ├── root-tailwind-config.test.ts
    │   │   ├── runtime-boundaries.test.ts
    │   │   ├── tailwind-config.reexport.test.ts
    │   │   ├── with-error-handling-node.node.test.ts
    │   ├── dashboard
    │   │   ├── a11y-skip-link.dom.test.tsx
    │   │   ├── ag-grid-modules.test.ts
    │   │   ├── ag-grid-registration.test.ts
    │   │   ├── cancellation.test.ts
    │   │   ├── dashboard-barrel-server-leak.test.ts
    │   │   ├── dashboard-use-client.test.ts
    │   │   ├── entity-columns-registry.test.ts
    │   │   ├── entity-export.route.test.ts
    │   │   ├── entity.actions.test.ts
    │   │   ├── entity.search-fields.test.ts
    │   │   ├── README.md
    │   │   ├── url-sync.test.ts
    │   │   ├── use-client.test.ts
    │   ├── e2e
    │   │   ├── dashboard-projects.smoke.test.ts
    │   │   ├── README.md
    │   │   ├── route-theme.smoke.test.ts
    │   ├── insights
    │   │   ├── category-filter.dom.test.tsx
    │   │   ├── content-service.test.ts
    │   │   ├── get-insights-by-category.test.ts
    │   │   ├── insights.runtime.test.ts
    │   ├── integrations
    │   ├── lib
    │   │   ├── marketing
    │   │   │   ├── barrels.test.ts
    │   │   ├── services
    │   │   │   ├── entity
    │   │   │   │   ├── adapters
    │   │   │   │   │   ├── aggrid.test.ts
    │   │   ├── validators
    │   │   │   ├── tableColumnConfig.test.ts
    │   ├── middleware
    │   ├── mocks
    │   ├── routes
    │   │   ├── entities
    │   │   │   ├── resolve-entity.test.ts
    │   │   │   ├── runtime-boundary.chat.test.ts
    │   ├── runtime-boundary
    │   │   ├── edge-imports.test.ts
    │   │   ├── node-route-config.test.ts
    │   │   ├── not-found.runtime.test.ts
    │   │   ├── README.md
    │   │   ├── route-config-as-const.test.ts
    │   │   ├── runtime-boundaries-server-only.test.ts
    │   │   ├── runtime-boundaries.test.ts
    │   ├── scripts
    │   │   ├── `__fixtures__`
    │   │   │   ├── malformed-allowlist.json
    │   │   │   ├── valid-allowlist.json
    │   │   ├── scan-styles-usage.test.ts
    │   ├── security
    │   │   ├── clickhouse-injection.test.ts
    │   │   ├── core-sql-guards.test.ts
    │   │   ├── csp-schema.test.ts
    │   │   ├── masking-userid-variants.test.ts
    │   │   ├── rate-limit.edge.test.ts
    │   │   ├── rate-limit.server.test.ts
    │   │   ├── README.md
    │   │   ├── sql-guards.test.ts
    │   │   ├── tenant-isolation.test.ts
    │   ├── setup
    │   │   ├── providers.tsx
    │   │   ├── README.md
    │   │   ├── vitest.setup.ts
    │   ├── styles
    │   │   ├── breakpoints-triangulation.test.ts
    │   │   ├── breakpoints.test.ts
    │   │   ├── typography-presence.test.ts
    │   ├── support
    │   │   ├── harness
    │   │   │   ├── api-route-harness.ts
    │   │   │   ├── node-mocks.ts
    │   │   │   ├── README.md
    │   │   │   ├── render.tsx
    │   │   │   ├── request.ts
    │   │   ├── mocks
    │   │   │   ├── atoms.ts
    │   │   │   ├── lib-api.ts
    │   │   │   ├── molecules.ts
    │   │   │   ├── next-cache.ts
    │   │   │   ├── next-headers.ts
    │   │   │   ├── next-navigation.ts
    │   │   │   ├── server-only.ts
    │   │   ├── setup
    │   │   │   ├── README.md
    │   │   │   ├── vitest.global-setup.ts
    │   │   │   ├── vitest.setup.dom.ts
    │   │   │   ├── vitest.setup.node.ts
    │   │   │   ├── vitest.setup.shared.ts
    │   │   ├── env-mocks.ts
    │   │   ├── README.md
    │   │   ├── resolve-route.ts
    │   │   ├── testkit.ts
    │   ├── types
    │   │   ├── openapi.types.test.ts
    │   ├── ui
    │   │   ├── providers
    │   │   │   ├── route-theme-provider.test.tsx
    │   │   ├── error-fallback.test.tsx
    │   │   ├── navbar.dom.test.tsx
    │   │   ├── segmented-control.dom.test.tsx
    │   ├── vendors
    │   │   ├── register.static-import.guard.test.ts
    │   ├── README.md
    ├── tmp
    │   ├── README.md
    │   ├── unused-exports-categorized.json
    │   ├── unused-exports.txt
    ├── types
    │   ├── api
    │   │   ├── generated
    │   │   │   ├── openapi.d.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── auth
    │   │   ├── authorization
    │   │   │   ├── types.d.ts.map
    │   │   ├── index.d.ts.map
    │   │   ├── README.md
    │   │   ├── roles.d.ts.map
    │   ├── chat
    │   │   ├── message
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── query
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── response
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── config
    │   │   ├── security
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── threat
    │   │   │   ├── types.d.ts.map
    │   │   ├── index.d.ts.map
    │   │   ├── README.md
    │   ├── dashboard
    │   │   ├── analytics
    │   │   │   ├── index.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── forms
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── integrations
    │   │   ├── supabase
    │   │   │   ├── api
    │   │   │   │   ├── types.d.ts.map
    │   │   │   │   ├── types.ts
    │   │   │   ├── core
    │   │   │   │   ├── types.d.ts.map
    │   │   │   │   ├── types.ts
    │   │   │   ├── index.d.ts.map
    │   │   │   ├── README.md
    │   │   ├── index.d.ts.map
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── marketing
    │   │   ├── contact
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── insights
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── landing
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── security
    │   │   ├── policy
    │   │   │   ├── types.d.ts.map
    │   │   ├── index.d.ts.map
    │   │   ├── README.md
    │   ├── shared
    │   │   ├── config
    │   │   │   ├── base
    │   │   │   │   ├── types.d.ts.map
    │   │   │   │   ├── types.ts
    │   │   │   ├── index.d.ts.map
    │   │   │   ├── README.md
    │   │   ├── core
    │   │   │   ├── entity
    │   │   │   │   ├── types.d.ts.map
    │   │   │   │   ├── types.ts
    │   │   │   ├── ui
    │   │   │   │   ├── types.d.ts.map
    │   │   │   │   ├── types.ts
    │   │   │   ├── async.d.ts.map
    │   │   │   ├── index.d.ts.map
    │   │   │   ├── README.md
    │   │   ├── feature-flags
    │   │   │   ├── types.d.ts.map
    │   │   │   ├── types.ts
    │   │   ├── system
    │   │   │   ├── events
    │   │   │   │   ├── types.d.ts.map
    │   │   │   │   ├── types.ts
    │   │   │   ├── index.d.ts.map
    │   │   │   ├── README.md
    │   │   ├── utils
    │   │   │   ├── dates
    │   │   │   │   ├── types.d.ts.map
    │   │   │   │   ├── types.ts
    │   │   │   ├── index.d.ts.map
    │   │   │   ├── README.md
    │   │   ├── auth/
    │   │   │   └── clerk.d.ts
    │   │   ├── analytics/
    │   │   │   └── window.d.ts
    │   │   ├── index.d.ts.map
    │   │   ├── index.ts
    │   │   ├── README.md
    │   ├── validators
    │   │   ├── runtime
    │   │   │   ├── types.ts
    │   │   ├── sql-safety
    │   │   │   ├── types.ts
    │   │   ├── index.d.ts.map
    │   │   ├── README.md
    │   ├── entity-grid.ts
    │   ├── README.md
    ├── .cursorignore
    ├── .dependency-cruiser.cjs
    ├── .env.example
    ├── .env.local
    ├── .env.test
    ├── .eslintrc.json
    ├── .knip.jsonc
    ├── .markdownlint.jsonc
    ├── .node-version
    ├── .npmrc
    ├── .nvmrc
    ├── .pnpmrc
    ├── .prettierignore
    ├── .prettierrc.js
    ├── .spectral.yaml
    ├── .stylelintignore
    ├── CHANGELOG.md
    ├── commitlint.config.cjs
    ├── corso.code-workspace
    ├── eslint.config.mjs
    ├── EXECUTION_PLAN.md
    ├── INSIGHTS_SEARCH_IMPLEMENTATION.md
    ├── instrumentation-client.ts
    ├── instrumentation.ts
    ├── jscpd.config.json
    ├── next-env.d.ts
    ├── next.config.mjs
    ├── package.json
    ├── playwright.config.ts
    ├── pnpm-lock.yaml
    ├── pnpm-workspace.yaml
    ├── postcss.config.js
    ├── proxy.ts
    ├── README.md
    ├── sgconfig.yml
    ├── tailwind.config.ts
    ├── ts-prune-allowlist.txt
    ├── tsconfig.json
    ├── vitest.config.ts

📊 Summary: 382 dirs, 1294 files, max depth: 6
