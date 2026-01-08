'use client';

import { createErrorBoundary } from '@/app/shared/create-error-boundary';

/**
 * Error boundary for authentication routes.
 * Catches errors within the auth section and provides recovery UI.
 */
export default createErrorBoundary({ context: 'Auth' });


