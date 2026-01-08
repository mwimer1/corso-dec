'use client';

import { createErrorBoundary } from '@/app/shared/create-error-boundary';

/**
 * Error boundary for protected routes.
 * Catches errors within the (protected) route group and provides recovery UI.
 */
export default createErrorBoundary({ context: 'Protected' });
