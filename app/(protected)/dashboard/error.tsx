// app/(protected)/dashboard/error.tsx
'use client';

import { createErrorBoundary } from '@/app/shared/create-error-boundary';

/**
 * Error boundary for dashboard routes.
 * Catches errors within the dashboard section and provides recovery UI.
 */
export default createErrorBoundary({ context: 'Dashboard' });
