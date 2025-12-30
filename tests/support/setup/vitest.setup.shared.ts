// Set environment variable for Enterprise features (tests require SSRM)
// MUST be set at the very top before any imports that might trigger publicEnv initialization
if (!process.env.NEXT_PUBLIC_AGGRID_ENTERPRISE) {
  process.env.NEXT_PUBLIC_AGGRID_ENTERPRISE = '1';
}

import { afterAll, beforeAll, vi } from "vitest";

// Ensure deterministic test env
beforeAll(() => {
  process.env.NODE_ENV = "test";
  // Silence noisy error logs from expected guard throws during tests
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  (console.error as any)?.mockRestore?.();
});

// Light fetch stub; tests can override per-suite.
if (typeof fetch === "undefined") {
  // @ts-expect-error assignable in Node test env
  globalThis.fetch = vi.fn(async () => new Response(null, { status: 200 }));
}

// Register AG Grid modules for tests (required for AG Grid v34+)
import { ensureAgGridRegistered } from '../../../lib/vendors/ag-grid.client';
ensureAgGridRegistered();

// Stub server-only side-effect module
vi.mock('server-only', () => ({}), { virtual: true });

// next/navigation minimal stub
vi.mock('next/navigation', () => {
  const push = vi.fn();
  const replace = vi.fn();
  const prefetch = vi.fn();
  const refresh = vi.fn();
  return {
    useRouter: () => ({ push, replace, prefetch, refresh }),
    usePathname: () => '/',
    useSearchParams: () => new URLSearchParams(),
  };
});

// next/headers minimal stub
vi.mock('next/headers', () => ({
  headers: () => new Headers(),
  cookies: () => ({ get: (_: string) => undefined, set: () => {}, delete: () => {}, getAll: () => [] }),
}));

// Sentry minimal stub
vi.mock('@sentry/nextjs', () => ({ init: vi.fn(), captureException: vi.fn(), captureMessage: vi.fn() }));

// Mock logger import for tests that need it
vi.mock('@/lib/monitoring', async (importOriginal) => {
  const actual = await importOriginal<any>();
  return {
    ...actual,
    logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() }
  };
});

// Mock lib/shared/constants/links for component tests
vi.mock('@/lib/shared/constants/links', () => ({
  APP_LINKS: {
    contact: '/contact',
    pricing: '/pricing',
    docs: '/docs',
    signIn: '/sign-in',
    signUp: '/sign-up',
    dashboard: '/dashboard',
    NAV: {
      JOIN_WAITLIST: '/join-waitlist',
      PRICING: '/pricing',
    }
  }
}));

// Centralized mocks for style/variant modules used across tests.
vi.mock('@/styles', () => ({
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
  iconVariants: (_opts: any) => '',
  tv: (_opts?: any) => () => '', // Mock tv (tailwind-variants factory) - returns a function that returns empty string
}));

vi.mock('@/styles/ui', async (importOriginal) => {
  // In case tests import specific named exports that exist at runtime,
  // spread the original (if available) and stub the variant fns.
  // This avoids "No export is defined on the mock" errors.
  let actual: any = {};
  try {
    actual = await (importOriginal as any)();
  } catch {
    // ignore if module not resolvable in tests
  }
  const stub = (_opts?: any) => '';
  return {
    ...actual,
    tableVariants: stub,
    tableHeadBase: stub,
    tableHeadRowBorder: '',
    labelVariants: stub,
    inputVariants: stub,
    buttonVariants: stub,
    dialogHeaderVariants: stub,
    // Commonly used across UI
    alertBoxVariants: stub,
    cardVariants: stub,
    badgeVariants: stub,
    checkboxVariants: stub,
    toggleVariants: stub,
    switchVariants: stub,
    progressVariants: stub,
    skeletonVariants: stub,
    linkVariants: stub,
    navItemVariants: stub,
    selectVariants: stub,
    textAreaVariants: stub,
    sliderVariants: stub,
    // Dashboard/layout
    dashboardShellVariants: stub,
    dashboardNavbar: stub,
    containerMaxWidthVariants: stub,
    fullWidthSectionContainerVariants: stub,
    // Chat/analytics
    followUpSuggestionVariants: stub,
    emptyStateVariants: stub,
    faqVariants: stub,
    // Forms/pricing
    contactFormVariants: stub,
    pricingCardVariants: stub,
    pricingGridVariants: stub,
    authCardVariants: stub,
    fileUploadVariants: stub,
  };
});

// Mock shared/errors to mirror production ApplicationError shape (accepts payload object)
vi.mock('@/lib/shared/errors', () => ({
  ApplicationError: class ApplicationError extends Error {
    code: string | undefined;
    category: any;
    severity: any;
    constructor(payload: any) {
      const message = (payload && typeof payload.message === 'string' && payload.message) ?? (typeof payload === 'string' ? payload : String(payload ?? ''));
      super(message);
      this.name = 'ApplicationError';
      this.code = payload?.code;
      this.category = payload?.category;
      this.severity = payload?.severity;
    }
  },
  ErrorCategory: {
    AUTHORIZATION: 'AUTHORIZATION',
    DATABASE: 'DATABASE',
    API: 'API',
    SECURITY: 'SECURITY'
  },
  ErrorSeverity: {
    CRITICAL: 'CRITICAL',
    ERROR: 'ERROR',
    WARNING: 'WARNING',
    INFO: 'INFO'
  }
}));



