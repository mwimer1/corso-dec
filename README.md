---
description: "Documentation and resources for documentation functionality."
last_updated: "2025-12-31"
category: "documentation"
status: "draft"
title: "README.md"
---
# Repository Scripts & Docs

Last updated: 2025-12-31

This README is generated from a single template (`README.scripts.hbs`).

- Directory: `.`
- Last updated: `2025-12-30`

> Edit the template or the generator context to change all READMEs consistently.

## TypeScript Path Aliases

The following path aliases are configured in `config/typescript/tsconfig.base.json`:

<!-- BEGIN:alias-table (auto-generated) -->
- **Foundational:**
  - `@/*` → `*`
  - `@/api/*` → `app/api/*`
  - `@/atoms` → `components/ui/atoms/index.ts`
  - `@/atoms/*` → `components/ui/atoms/*`
  - `@/components/*` → `components/*`
  - `@/components/ui/*` → `components/ui/*`
  - `@/contexts` → `contexts/index.ts`
  - `@/contexts/*` → `contexts/*`
  - `@/hooks/*` → `hooks/*`
  - `@/hooks/protected` → `hooks/index.ts`
  - `@/integrations` → `lib/integrations/index.ts`
  - `@/integrations/*` → `lib/integrations/*`
  - `@/lib` → `lib/*`
  - `@/lib/*` → `lib/*`
  - `@/lib/api` → `lib/api/index.ts`
  - `@/lib/api/client` → `lib/api/client.ts`
  - `@/lib/api/data/entity-data` → `lib/api/data/entity-data.ts`
  - `@/lib/api/response/http` → `lib/api/response/http.ts`
  - `@/lib/auth/authorization/constants` → `lib/auth/authorization/constants.ts`
  - `@/lib/auth/authorization/roles` → `lib/auth/authorization/roles.ts`
  - `@/lib/auth/client` → `lib/auth/client.ts`
  - `@/lib/auth/server` → `lib/auth/server.ts`
  - `@/lib/config` → `lib/config/index.ts`
  - `@/lib/events` → `lib/shared/events/index.ts`
  - `@/lib/monitoring` → `lib/monitoring/index.ts`
  - `@/lib/monitoring/core/logger` → `lib/monitoring/core/logger.ts`
  - `@/lib/security` → `lib/security/index.ts`
  - `@/lib/server` → `lib/server/index.ts`
  - `@/lib/shared` → `lib/shared/index.ts`
  - `@/lib/shared/*` → `lib/shared/*`
  - `@/lib/shared/client` → `lib/shared/client.ts`
  - `@/lib/supabase/middleware` → `lib/supabase/middleware/index.ts`
  - `@/lib/supabase/middleware/*` → `lib/supabase/middleware/*`
  - `@/lib/validators` → `lib/validators/index.ts`
  - `@/molecules` → `components/ui/molecules/index.ts`
  - `@/molecules/*` → `components/ui/molecules/*`
  - `@/organisms` → `components/ui/organisms/index.ts`
  - `@/organisms/*` → `components/ui/organisms/*`
  - `@/shared/audit/types` → `types/shared/audit/types.ts`
  - `@/shared/config/types` → `types/shared/config/types.ts`
  - `@/shared/data` → `types/shared/data/index.ts`
  - `@/shared/performance/cache-config/types` → `types/shared/performance/cache-config/types.ts`
  - `@/shared/system/error/types` → `types/shared/system/error/types.ts`
  - `@/styles` → `styles/index.ts`
  - `@/styles/*` → `styles/*`
  - `@/styles/breakpoints` → `styles/breakpoints.ts`
  - `@/styles/shared-variants` → `styles/shared-variants.ts`
  - `@/styles/utils` → `styles/utils.ts`
  - `@/tests/*` → `tests/*`
  - `@/tests/helpers` → `tests/__setup__/helpers/index.ts`
  - `@/tests/helpers/*` → `tests/__setup__/helpers/*`
  - `@/tests/utils` → `tests/__setup__/utils/index.ts`
  - `@/tests/utils/*` → `tests/__setup__/utils/*`
  - `@/types/*` → `types/*`
  - `@/types/api` → `types/api/index.ts`
  - `@/types/api/response` → `types/api/response/types.ts`
  - `@/types/chat/message` → `types/chat/message/types.ts`
  - `@/types/chat/query` → `types/chat/query/types.ts`
  - `@/types/chat/response` → `types/chat/response/types.ts`
  - `@/types/chat/visualization` → `types/chat/visualization/types.ts`
  - `@/types/config/security` → `types/config/security/types.ts`
  - `@/types/config/threat` → `types/config/threat/types.ts`
  - `@/types/dashboard/entity` → `types/dashboard/entity/index.ts`
  - `@/types/dashboard/table` → `types/dashboard/table/index.ts`
  - `@/types/dashboard/table/types` → `types/dashboard/table/types.ts`
  - `@/types/dashboard/user-data` → `types/dashboard/user-data/index.ts`
  - `@/types/integrations/*` → `types/integrations/*`
  - `@/types/shared/system` → `types/shared/system/index.ts`
  - `@/types/shared/system/error` → `types/shared/system/error/types.ts`
  - `@/types/shared/system/events` → `types/shared/system/events/types.ts`
  - `@/types/supabase` → `types/supabase/index.ts`
  - `@/types/supabase/api` → `types/supabase/api/types.ts`
  - `@/types/supabase/core` → `types/supabase/core/types.ts`
  - `@corso/eslint-plugin` → `eslint-plugin-corso/dist/index`
  - `@corso/eslint-plugin/*` → `eslint-plugin-corso/dist/*`
  - `@shared` → `types/shared/index.ts`
  - `@shared/*` → `types/shared/*`
  - `@shared/data` → `types/shared/data/index.ts`
  - `@shared/data/status` → `types/shared/data/status/types.ts`
  - `@shared/dates` → `types/shared/dates/types.ts`
  - `@shared/feature-flags` → `types/shared/feature-flags/types.ts`
  - `@tests/support/*` → `tests/support/*`
<!-- END:alias-table -->

