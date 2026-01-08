import { ApplicationError, ErrorCategory, ErrorSeverity } from '@/lib/shared';

/**
 * Assert that the caller has one of the required roles.
 *
 * ```ts
 * assertRole(userRole, ['admin', 'owner']);
 * ```
 * @param currentRole Current role string
 * @param required One or more allowed roles
 * @throws ApplicationError (FORBIDDEN) when mismatch
 */
export function assertRole(
  currentRole: string | null | undefined,
  required: string | string[],
): void {
  const allowed = Array.isArray(required) ? required : [required];
  if (!allowed.includes(currentRole ?? '')) {
    throw new ApplicationError({
      message: 'Insufficient role permissions.',
      code: 'FORBIDDEN',
      category: ErrorCategory.AUTHENTICATION,
      severity: ErrorSeverity.ERROR,
      context: { currentRole, required: allowed },
    });
  }
}

/**
 * @deprecated Use assertRole instead. Organization context has been removed.
 */
// Organization-specific assertion removed. Use assertRole exclusively.
