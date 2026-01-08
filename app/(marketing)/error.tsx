'use client';

import { createErrorBoundary } from '@/app/shared/create-error-boundary';

/**
 * Error boundary for marketing routes.
 * Catches errors within the marketing section and provides recovery UI.
 */
export default createErrorBoundary({ context: 'Marketing' });

