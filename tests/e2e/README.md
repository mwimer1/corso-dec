---
title: "E2e"
description: "Documentation and resources for documentation functionality. Located in e2e/."
last_updated: "2026-01-07"
category: "documentation"
status: "active"
---
# E2E Tests

End-to-end smoke tests for dashboard functionality using Playwright.

## Prerequisites

1. Install Playwright browsers (first time only):
   ```bash
   pnpm test:e2e:install
   ```

2. Ensure the development server can start with test environment variables (configured in `playwright.config.ts`)

## Running Tests

### Run all E2E tests
```bash
pnpm test:e2e
```

### Run with UI mode (interactive)
```bash
pnpm test:e2e:ui
```

### Run a specific test file
```bash
pnpm exec playwright test tests/e2e/dashboard-projects.smoke.test.ts
```

## Environment Variables

E2E tests run with the following environment variables automatically configured by `playwright.config.ts`:

- `NODE_ENV=test` - Test environment mode
- `PLAYWRIGHT=1` - Playwright test flag
- `E2E_BYPASS_AUTH=true` - Bypass authentication for tests
- `NEXT_PUBLIC_AUTH_MODE=relaxed` - Relaxed auth mode
- `ALLOW_RELAXED_AUTH=true` - Enable relaxed auth
- `CORSO_USE_MOCK_DB=true` - Use mock database
- `DISABLE_RATE_LIMIT=true` - Disable rate limiting for tests
- `NEXT_PUBLIC_AGGRID_ENTERPRISE=1` - Enable AG Grid Enterprise features

## Test Structure

Tests are located in `tests/e2e/` and follow Playwright's standard test patterns.

### Current Tests

- **`dashboard-projects.smoke.test.ts`** - Smoke tests for `/dashboard/projects` page
  - Verifies page loads and displays data
  - Checks for results count badge
  - Ensures no request storms
  - Validates graceful handling of invalid query parameters

## Auth Bypass

E2E tests use an auth bypass mechanism that:
- Only works when `E2E_BYPASS_AUTH=true` AND (`NODE_ENV=test` OR `PLAYWRIGHT=1`)
- Never works in production (explicit guard)
- Allows tests to run without real Clerk authentication

The bypass is implemented in `app/(protected)/dashboard/layout.tsx` and is test-only.

## CI Integration

For CI/CD pipelines, ensure:
1. Playwright browsers are installed: `pnpm test:e2e:install`
2. Tests run with the environment variables configured in `playwright.config.ts`
3. The webServer automatically starts the dev server with the correct environment

## Troubleshooting

### Tests fail with "timeout waiting for page to load"
- Ensure the dev server starts correctly
- Check that all required environment variables are set
- Verify mock database files exist in `public/__mockdb__/`

### Tests fail with "authentication required"
- Verify `E2E_BYPASS_AUTH=true` is set
- Check that `NODE_ENV=test` or `PLAYWRIGHT=1` is set
- Ensure the auth bypass logic in `app/(protected)/dashboard/layout.tsx` is working

### Playwright browsers not found
- Run `pnpm test:e2e:install` to install browsers
- Check that Playwright was installed correctly: `pnpm list @playwright/test`
