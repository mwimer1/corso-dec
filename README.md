# Corso

Modern data platform for construction project management and insights.

## Where Things Live

This repository follows a clear directory structure:

- **`app/`** - Next.js routes and API handlers
  - Routes: `app/(marketing)/`, `app/(protected)/dashboard/`, etc.
  - API endpoints: `app/api/v1/` (public), `app/api/internal/` (webhooks)
  - See [app/README.md](app/README.md) for route structure details

- **`components/`** - React UI components
  - Organized by domain (auth, billing, chat, dashboard, etc.)
  - Shared UI primitives in `components/ui/`
  - See [components/README.md](components/README.md) for component patterns

- **`lib/`** - Business logic and utilities
  - Domain modules: `lib/auth/`, `lib/chat/`, `lib/marketing/`, etc.
  - Server-only code: `lib/server/` (database, integrations)
  - Client-safe code: `lib/shared/` (validation, config)
  - See [lib/README.md](lib/README.md) for module organization

- **`scripts/`** - Automation and tooling
  - CI checks: `scripts/ci/`
  - Linting: `scripts/lint/`
  - Maintenance: `scripts/maintenance/`
  - See [scripts/README.md](scripts/README.md) for available scripts

- **`docs/`** - Documentation and audits
  - Architecture: `docs/architecture/`
  - API docs: `docs/api/`
  - Development guides: `docs/development/`
  - Audit reports: `docs/audits/`

- **`tests/`** - Test suites
  - Unit tests: `tests/lib/`, `tests/components/`
  - Integration tests: `tests/api/`
  - E2E tests: `tests/e2e/`
  - See [tests/README.md](tests/README.md) for testing patterns

- **`styles/`** - Design tokens and UI variants
  - Tokens: `styles/tokens/` (colors, spacing, typography)
  - UI variants: `styles/ui/` (component variants)
  - Global styles: `styles/globals.css`

- **`types/`** - Shared TypeScript types
  - Domain types: `types/billing/`, `types/chat/`, etc.
  - Generated types: `types/api/generated/` (from OpenAPI)
  - Supabase types: `types/supabase/`

- **`supabase/`** - Database migrations
  - Migrations: `supabase/migrations/`
  - Config: `supabase/config.toml`

## Structure Decisions

### `hooks/` Directory

**Status:** Will be consolidated/removed in future cleanup.

Currently contains placeholder directories with only README files. Active hooks should live in:
- `hooks/shared/` - Shared React hooks (currently active)
- Domain-specific hooks should be moved to `lib/[domain]/hooks/` or `components/[domain]/hooks/`

See guardrail: `pnpm guards:placeholders` to prevent new placeholder directories.

### `tmp/` Directory

**Status:** Ephemeral; should not be committed.

The `tmp/` directory is gitignored and used for temporary build artifacts and analysis outputs. Files in `tmp/` are not tracked in git and should not be committed.

### Server Actions vs API Routes

**Server Actions:**
- **Location**: Colocated with the feature (e.g., `app/(marketing)/contact/actions.ts`)
- **Use for**: Form submissions, simple mutations from client components
- **Characteristics**: Direct function calls (no HTTP overhead), type-safe, automatic request/response handling

**API Routes (`app/api/`):**
- **Use for**: HTTP endpoints for external clients, streaming responses (NDJSON), OpenAPI documentation, complex operations, external integrations

**Example:** The contact form uses a Server Action (colocated with the feature) because it's a simple form submission. Chat processing uses `app/api/v1/ai/chat/route.ts` because it requires streaming NDJSON responses.

**Important:** Do not create a top-level `actions/` directory. Server Actions are feature-colocated. The `lib/actions/` directory contains shared helper utilities only.

For detailed guidance, see:
- [Actions vs API Routes](docs/architecture/actions-vs-api-routes.md) - Decision guide
- [API Routes README](app/api/README.md) - API routes documentation

## Quick Start

```bash
# Install dependencies
pnpm install

# Verify environment
pnpm validate:env

# Run development server
pnpm dev

# Run quality gates
pnpm quality:local
```

## Development

See [docs/development/setup-guide.md](docs/development/setup-guide.md) for:
- Environment setup
- Development workflow
- Quality gates
- Git workflow

## Documentation

- **Architecture**: [docs/architecture/](docs/architecture/)
- **API**: [api/README.md](api/README.md) (OpenAPI specification)
- **Security**: [.cursor/rules/security-standards.mdc](.cursor/rules/security-standards.mdc)
- **Contributing**: [docs/contributing/](docs/contributing/)

---

_Last updated: 2025-01-03_
