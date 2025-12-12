## Unreleased

### Removed
- **components/forms**: Removed deprecated `FieldBase` alias export. Use `FormFieldBase` directly instead.
- **components/ui/molecules**: Removed deprecated `error` prop from `TextArea` component. Use `state="error"` instead.
- **components/marketing/sections**: Removed deprecated `PricingSection` component. Use `PricingPage` or compose `PricingHeader` + `PricingTiers` instead.

### Updated
- **Dependencies**: Updated multiple packages to latest versions:
  - `@clerk/nextjs`: ^6.31.10 → ^6.32.2 (security updates and improvements)
  - `@supabase/postgrest-js`: 1.17.11 → 1.21.4 (improved query capabilities)
  - `@types/node`: ^24.3.1 → ^24.5.2 (TypeScript improvements)
  - `@typescript-eslint/eslint-plugin`: 8.41.0 → 8.44.1 (linting improvements)
  - `@typescript-eslint/parser`: 8.41.0 → 8.44.1 (linting improvements)
  - `eslint`: ^9.34.0 → ^9.36.0 (linting improvements)
  - `openai`: ^5.15.0 → ^5.23.0 (new features and bug fixes)
  - `pnpm`: 10.15.0 → 10.17.1 (package manager improvements)
  - `react-hook-form`: ^7.62.0 → ^7.63.0 (form handling improvements)
  - `stylelint`: 16.23.1 → 16.24.0 (CSS linting improvements)
  - `svix`: ^1.75.1 → ^1.76.1 (webhook verification improvements)

### Removed
- **Unused dependencies**: Removed packages that were no longer used after Clerk billing migration:
  - `@clerk/themes` (functionality moved to Clerk Dashboard)
  - `@stripe/stripe-js` (billing handled by Clerk)
  - `jsonwebtoken` (not used in current implementation)
  - `stripe` (billing handled by Clerk)
  - `@radix-ui/react-use-effect-event` (not used in current components)
  - `cross-env` (not used in scripts)
  - `import-in-the-middle` (not used in current setup)
  - `require-in-the-middle` (not used in current setup)

### Fixed
- pricing: JSON-LD price extraction now captures decimals (e.g., `$19.99`) for accurate SEO data.
- pricing: `PricingPage` now prefers provided `annualPriceText` (from `PRICING_UI.annualUsd`) eliminating duplicate annual price math.
- validators: Fixed circular dependency issues in test imports by using inline schemas.
- TypeScript: Fixed unused variable warnings in route handlers and utilities.
- **Build System**: Resolved all 17 circular dependencies causing webpack runtime errors during production builds.
- **Auth Pages**: Fixed Next.js 15 Server Component compatibility by converting sign-in/sign-up pages to Client Components.

# Changelog

All notable changes to the Corso platform will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed
- Dashboard: Consolidated entity list pages (`addresses`, `companies`, `projects`) into a single dynamic route `app/(protected)/dashboard/(entities)/[entity]` with per-entity config; URLs unchanged (`/dashboard/{entity}`). Docs and Cursor rules updated.

### Improvements
- Landing: Vertical guidelines now use token color `hsl(var(--border))` and correct breakpoint; lines are visible and theme-consistent.
- Accessibility: Added ARIA-compliant tabpanel in ProductShowcase; PillGroup uses radiogroup/aria-checked; Number inputs announce hints via aria-describedby.
- Analytics: Hero CTAs now tracked via LinkTrack; ROI CTA tracks via onClick trackNavClick.
- Performance: ProductShowcase images include responsive `sizes`; removed unused resize state in YearRangeSlider; minor cleanup in PillGroup.
- DX: Migrated landing navbar to CSS Modules (removed global CSS); added Storybook stories for Hero, ProductShowcase, ROICalculator, MarketInsights; added AST-grep rules to enforce landing conventions.

### Added

- **Production-Ready Alias Documentation Script** - Comprehensive TypeScript path alias management
- **ESLint React Hooks Plugin** - Added `eslint-plugin-react-hooks` with proper flat config integration
  - Resolves "Definition for rule 'react-hooks/exhaustive-deps' was not found" errors
  - Configured `react-hooks/rules-of-hooks` as error and `react-hooks/exhaustive-deps` as warning
  - Package added as dev dependency to `package.json` (version ^5.2.0)
### Fixed

- **UI/Slider**: Added `onValueCommit`, vertical orientation classes, a11y tooltip improvements (`aria-hidden`, `pointer-events-none`), optional `formatValue`, and explicit `min/max/step` defaults. File: `components/ui/atoms/slider.tsx`.
- ForwardRef typing corrected for `Slider` to use `ForwardedRef` and `props` restructuring.

- **CSP nonce propagation & hydration mismatch**
  - Middleware now generates a per-request CSP nonce and propagates it to both request and response headers
  - Added `getSSRSecurityNonce()` for Server Components/layouts to retrieve the nonce via `next/headers`
  - Updated `app/(marketing)/layout.tsx` and `app/(auth)/layout.tsx` to pass `{ nonce }` to Next.js `<Script>` (beforeInteractive)
  - Resolves hydration error caused by `<Script>` rendering with `nonce={undefined}` on server vs empty on client
  - Files: `middleware.ts`, `lib/middleware/http/security-headers.ts`, `lib/middleware/index.ts`, `app/(marketing)/layout.tsx`, `app/(auth)/layout.tsx`

  - `pnpm docs:aliases` - Updates README.md with current alias table from tsconfig
  - `pnpm docs:aliases:check` - CI-safe check mode that fails if documentation is out of date
  - Properly resolves TypeScript `extends` and `references` chains using compiler API
  - Documents all targets for multi-target aliases (comma-separated)
  - Normalizes paths for cross-platform consistency (Windows/Unix)
  - Only writes when changes are detected (clean working tree)
  - Integrated into CI pipeline for documentation freshness validation
  - Comprehensive test coverage with smoke test for README markers

## [0.2.0] - 2025-08-14

### Added

- **Request Correlation ID System** - Comprehensive API tracing
  - `getRequestId` precedence: x-request-id > x-correlation-id > x-vercel-id > cf-ray > generated
  - `X-Request-ID` header on all wrapped responses with CORS exposure
  - `withApiWrappers` enforces rate limit inside, error handling outside
  - Streaming routes emit `event:error` NDJSON with `{ success:false, error, requestId }`
  - Webhook routes manually set/expose `X-Request-ID` (guardrail allowlisted)
  - Guardrail: `ensure-api-wrappers` ast-grep rule and CI validation
  - Client: `ApiHttpError` exposes `.status`, `.code`, `.requestId`
  - Canary: `pnpm canary:request-id` for local/CI header validation

- **Shared UI Variants System** - Comprehensive design system consolidation
  - **Form Input Base**: Unified sizing, validation states, focus patterns for input/select/textarea/checkbox/radio
  - **Interactive Base**: Shared sizing, thumb styling for slider/switch/radio/toggle components
  - **Chart Container Base**: Unified border, background, shadow, padding for all chart types
  - **Container Max Width**: Standardized patterns from `xs` to `7xl` with specialized variants
  - **Dialog Base**: Shared overlay, content, header, footer patterns with consistent positioning

### Changed

- CORS preflight merges `Access-Control-Allow-Headers` to include `X-Request-ID` (non-clobbering)
- API wrappers ensure header presence on all response types (2xx/4xx/5xx/429)
- **20+ component variant files** refactored to use shared bases
- **15+ component implementations** migrated to shared variants
- **500+ lines** of duplicate variant definitions eliminated

### Security

- Improved request tracing for incident triage and cross-service correlation

### DX

- Added `pnpm canary:request-id` for header exposure and streaming validation
- **11.3% reduction** in duplicated tokens (3,690 → 3,173)
- **10.5% reduction** in clone count (95 → 85)
- **11.2% reduction** in duplicated lines (765 → 679)

---

## [0.1.0] - 2025-08-11

### Added

- **Actions Refactoring** - 100% code duplication elimination
  - All action domains refactored: billing (9), chat (4), dashboard (6), marketing (2), onboarding (3)
  - Standardized patterns: error handling, rate limiting, validation, caching
  - **Before**: 53 clone groups with 30-35% duplication
  - **After**: 0 clones with 100% duplication elimination

- **Security Consolidation** - All security utilities consolidated in `lib/security/`
  - AI security validation, rate limiting, input sanitization
  - Prompt guard, audit logging, tenant isolation
  - Migration completed with backward compatibility

- **Documentation Audit** - Comprehensive README updates across codebase
  - All domains documented with current implementation details
  - Migration guides for breaking changes
  - Component coverage and usage examples

### Changed

- **Domain Relocations**: Marketing helpers, billing validators, security functions moved to appropriate domains
- **Chart Configuration**: Unified single source of truth for all chart types
- **Component Stories**: Enhanced Storybook coverage with accessibility and interaction testing

---

## Contributing

When adding new entries to this changelog, please follow the [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format and include:

- **Added** for new features
- **Changed** for changes in existing functionality
- **Deprecated** for soon-to-be removed features
- **Removed** for now removed features
- **Fixed** for any bug fixes
- **Security** in case of vulnerabilities

Each change should include a brief description and, when applicable, reference to the affected files or components.

