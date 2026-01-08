import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';
import { auth } from '@clerk/nextjs/server';
import 'server-only';

/**
 * @deprecated Use `auth()` from '@clerk/nextjs/server' instead.
 * This function is kept for backward compatibility but will be removed in a future version.
 * @example
 * ```ts
 * // Old (deprecated)
 * const userId = await requireUserId();
 *
 * // New (recommended)
 * const { userId } = await auth();
 * if (!userId) return http.error(401, 'Unauthorized', { code: 'HTTP_401' });
 * ```
 */
export async function requireUserId(): Promise<string> {
  const { userId } = await auth();
  if (!userId) {
    throw new ApplicationError({
      message: 'User must be authenticated',
      code: 'UNAUTHENTICATED',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
    });
  }
  return userId;
}

// Server-only utilities - simplified for Clerk v6



