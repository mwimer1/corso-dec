---
category: "documentation"
last_updated: "2025-12-29"
status: "draft"
title: "References"
description: "Documentation and resources for documentation functionality. Located in references/."
---
# Environment Variables Reference

## CORSO_USE_MOCK_DB

- Type: "true" | "false"
- Purpose: When set to "true" in development, entity data routes (projects, companies, addresses) read from static JSON fixtures under `public/__mockdb__/`.
- Source of truth: The JSON fixtures in `public/__mockdb__/` are checked into the repo (no CSV generation step).

- **Canonical Flag**: `CORSO_USE_MOCK_DB` is the primary environment variable for enabling mock database mode.
- **Legacy Support**: The app accepts `USE_MOCK_DB` (server-side) and `NEXT_PUBLIC_USE_MOCK_DB` (client-side) for backward compatibility in the current release, but these are deprecated and will be removed in a future version.
- **Deprecation Note**: Use `CORSO_USE_MOCK_DB` for all new code. Legacy flags are maintained only for existing configurations.
- Edge-safety: API routes run on Edge and fetch mock JSON from `/__mockdb__/...`, avoiding any Node `fs` usage.

## CORSO_USE_MOCK_CMS

- Type: "true" | "false" | undefined
- Purpose: When set to "true" in development, marketing content (insights, articles) is read from static JSON fixtures under `public/__mockcms__/` instead of markdown files or a real CMS.
- Source of truth: The JSON fixtures in `public/__mockcms__/` are checked into the repo (generated via `pnpm port:mockcms:insights`).
- Default behavior:
  - **Dev/test**: Defaults to `true` (enabled) unless explicitly set to `false`
  - **Production**: Defaults to `false` (disabled) unless explicitly set to `true`
- Build-safety: Uses filesystem reads (Node.js runtime), avoiding self-HTTP fetch during build.
- Content source precedence:
  1. If `CORSO_USE_MOCK_CMS=true` → use mock CMS fixtures
  2. Else if `CORSO_CMS_PROVIDER=directus` → use Directus adapter
  3. Else → use legacy adapter (markdown/static fallback)

## CORSO_CMS_PROVIDER

- Type: "legacy" | "directus" | undefined
- Purpose: Selects the CMS provider when not using mock CMS mode.
- Default: "legacy" (markdown/static content)
- Options:
  - `"legacy"`: Uses existing markdown files from `content/insights/articles/` or static fallback
  - `"directus"`: Uses Directus CMS (requires `DIRECTUS_URL` and `DIRECTUS_TOKEN`)

## DIRECTUS_URL

- Type: URL string
- Purpose: Directus CMS instance URL (only used when `CORSO_CMS_PROVIDER=directus`).
- Example: `https://cms.example.com`

## DIRECTUS_TOKEN

- Type: string
- Purpose: Directus authentication token (only used when `CORSO_CMS_PROVIDER=directus`).
- Security: Server-only variable, never exposed to client.

## NEXT_PUBLIC_USE_MOCK_AI

- Type: "true" | "1" | undefined
- Purpose: When set to "true" or "1" in development, chat AI responses are generated locally without calling the OpenAI API. Useful for UI/UX development and testing without backend connectivity.
- Behavior:
  - Bypasses `/api/v1/ai/chat` endpoint calls
  - Generates context-aware mock responses based on mode (projects/companies/addresses) and question keywords
  - Simulates realistic typing delay (~500ms) for natural UX
  - Returns mock data for common queries (e.g., "last 30 days", "top 10 contractors", "trending")
- Edge-safety: Mock responses are generated client-side, avoiding any API calls.

## Edge Cases & Hidden Dependencies

### Mock DB Environment Resolution

The mock database feature has complex runtime dependencies that developers must understand:

**Environment Variable Precedence:**
1. **Server-side**: `USE_MOCK_DB` (server environment variable)
2. **Client-side**: `NEXT_PUBLIC_USE_MOCK_DB` (public environment variable)
3. **Fallback**: `CORSO_USE_MOCK_DB` (canonical internal flag)

**Runtime Behavior:**
- **Edge Runtime**: Cannot access server environment variables, falls back to `NEXT_PUBLIC_USE_MOCK_DB`
- **Server-side Rendering (SSR)**: May have access to both server and public variables
- **Browser**: Only `NEXT_PUBLIC_*` variables available after hydration
- **Build Time**: Static replacement of all available environment variables
- **Test Environment**: Tests automatically use mock mode when `NODE_ENV === 'test'` (no flag needed in test setup)

**Hidden Dependencies:**
- Mock JSON files live in `public/__mockdb__/` and are served from that directory (Edge-compatible)
- Entity routes automatically detect and use mock data when flag is enabled
- No UI changes required - uses existing data fetching patterns

### NEXT_PUBLIC_APP_URL

- Type: URL string
- Purpose: Base URL for the application used for absolute links, email templates, and OAuth redirects. Required for proper functionality of features like email notifications, social sharing, and external authentication flows.
- Example: `http://localhost:3000` (development), `https://app.corso.com` (production)
- Usage: Set to your application's public URL including protocol and port (if non-standard).

### Environment Access Patterns

#### Client-Safe Environment Access
```typescript
// ✅ CORRECT: Client-safe configuration
import { publicEnv } from '@/lib/shared/config/client';

// ❌ INCORRECT: Direct environment access in client code (deprecated flag)
const mockEnabled = process.env.NEXT_PUBLIC_USE_MOCK_DB === 'true';
```

#### Server-Safe Environment Access
```typescript
// ✅ CORRECT: Server-only configuration
import { getEnv } from '@/lib/server/env';
const apiKey = getEnv().OPENAI_API_KEY;

// ❌ INCORRECT: Client environment access in server code
import { publicEnv } from '@/lib/shared/config/client';
```

#### Edge-Safe Environment Access
```typescript
// ✅ CORRECT: Edge-compatible configuration
import { getEnvEdge } from '@/lib/api';
const apiKey = getEnvEdge().OPENAI_API_KEY;  // Only includes client-safe environment variables

// ❌ INCORRECT: Server environment access in Edge functions
import { getEnv } from '@/lib/server/env';  // Will fail - Edge runtime cannot access server-only vars
```

#### Environment Access Layering

**Server Environment (`getEnv()`)**:
- Contains all server-side environment variables including `CORSO_USE_MOCK_DB`, `CORSO_USE_MOCK_CMS`, `CORSO_CMS_PROVIDER`, `DIRECTUS_URL`, `DIRECTUS_TOKEN`
- Available only in Node.js runtime (server components, API routes, server actions)
- Includes sensitive configuration like database URLs, API keys, secrets
- **Not available in Edge runtime or client-side code**

**Edge Environment (`getEnvEdge()`)**:
- Subset of environment variables safe for Edge runtime
- Excludes server-only variables like `CORSO_USE_MOCK_DB`, `CORSO_USE_MOCK_CMS`, `DIRECTUS_URL`, `DIRECTUS_TOKEN`
- Includes `CORSO_USE_MOCK_CMS` for Edge-compatible content source selection
- Available in Edge functions, client components, and shared utilities
- Only includes `NEXT_PUBLIC_*` prefixed variables and build-time constants

**Important**: `getEnv()` will **fail at runtime** in Edge functions due to missing server-only environment variables. Always use `getEnvEdge()` for Edge-compatible code.

### Build-Time vs Runtime Environment Variables

#### Static Replacement (Build Time)
- **NEXT_PUBLIC_* variables**: Replaced at build time with actual values
- **NODE_ENV**: Replaced with 'development', 'production', or 'test'
- **NEXT_PUBLIC_APP_URL**: Used for static asset generation

#### Runtime Access (Server-Side)
- **Database URLs**: Accessed at runtime for connection establishment
- **API Keys**: Retrieved at runtime for external service calls
- **Feature Flags**: Evaluated at runtime based on current context

#### Hybrid Access (SSR/Client Hydration)
- **Mock DB Flag**: Resolved during SSR, then re-evaluated on client hydration
- **User Preferences**: Server-side rendering with client-side overrides
- **Authentication State**: Server verification with client-side updates

### Environment Validation & Error Handling

#### Required Environment Variables
```typescript
// Server-side validation with detailed error messages
const env = requireServerEnv(); // Throws ApplicationError if invalid

// Client-side validation with graceful fallbacks
const mockEnabled = publicEnv.USE_MOCK_DB ?? false;
```

#### Environment-Specific Behavior
```typescript
// Development-only features
if (publicEnv.NEXT_PUBLIC_STAGE === 'development') {
  // Enable development-specific functionality
}

// Production optimizations
if (publicEnv.NEXT_PUBLIC_STAGE === 'production') {
  // Apply production-specific optimizations
}
```

### Migration from Legacy Patterns

#### Before (Legacy Direct Access)
```typescript
// ❌ OLD: Direct environment access
const mockDb = process.env.USE_MOCK_DB === 'true';
const apiUrl = process.env.NEXT_PUBLIC_API_URL;
```

#### After (Centralized Configuration)
```typescript
// ✅ NEW: Centralized environment access
import { getEnv } from '@/lib/server/env';
import { publicEnv } from '@/lib/shared/config/client';

const mockDb = getEnv().CORSO_USE_MOCK_DB;
const apiUrl = publicEnv.NEXT_PUBLIC_API_URL;
```

### Testing Environment Configuration

#### Test Environment Variables
- **`.env.test`**: Test-specific environment variables
- **Mock Services**: Test database, external API mocks
- **Feature Flags**: Test-specific feature toggles
- **Debug Settings**: Enhanced logging and validation for tests

#### CI/CD Environment Variables
- **Build-time variables**: Statically replaced during CI builds
- **Runtime variables**: Injected at container startup
- **Secret management**: Secure handling of sensitive configuration
- **Environment validation**: Automated checks for required variables

# Server Environment

- Canonical module: `@/lib/server/env`
- Functions:
  - `requireServerEnv()`: validates (Zod) and returns a cached, typed env object; throws if missing/invalid.
  - `getEnv(key)`: convenience accessor backed by `requireServerEnv()`.
- Notes:
  - Module is server-only and includes `import 'server-only'`.
  - Do **not** read `process.env` directly outside this module.

## Allowed Exceptions for process.env Usage

While the general rule is to use environment utilities, certain `process.env` usage is allowed with explanatory comments:

### Build-time Optimization
```typescript
// NODE_ENV check allowed for build-time optimization
process.env.NODE_ENV === 'development' && (() => {
  const Devtools = dynamic(
    () => import('@tanstack/react-query-devtools'),
    { ssr: false }
  );
  return <Devtools initialIsOpen={false} />;
})();
```

### Dev-only Logging and Validation
```typescript
// NODE_ENV check allowed for dev-only logging
if (process.env.NODE_ENV !== 'production') {
  console.log('Debug information');
}

// NODE_ENV check allowed for dev-only validation
if (process.env.NODE_ENV !== 'production') {
  // Runtime validation logic
}
```

### Runtime Compatibility
```typescript
// NODE_ENV check allowed for runtime compatibility
const isProd = (typeof process !== 'undefined' ? process.env.NODE_ENV : undefined) === 'production';
```

### Environment Module Implementation
- `lib/server/env.ts`: Uses `process.env` internally for env access
- `lib/shared/config/client.ts`: Uses `process.env` for `NEXT_PUBLIC_*` variables
- `lib/shared/env/public.ts`: Uses `process.env` fallback for client-side access

### Configuration and Build Files
- `*.config.*`: Build and linting configuration files
- `next.config.*`: Next.js configuration
- `vitest.config.*`: Vitest configuration
- `eslint.config.*`: ESLint configuration

### Documentation and Examples
- `**/*.md`: Documentation examples
- `docs/**`: Documentation files
- `.cursor/rules/**`: Cursor rules documentation

### Scripts and Tests
- `scripts/**`: Build and utility scripts
- `tests/**`: Test files
- `tools/**`: Development tools

**Important**: All allowed `process.env` usage must include explanatory comments stating why direct access is necessary.
