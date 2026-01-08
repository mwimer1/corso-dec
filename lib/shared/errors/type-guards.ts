/**
 * @fileoverview Type guards for error objects
 * @description Provides type-safe utilities for narrowing error types without using `as any`
 */

/**
 * Type guard to check if an error has a `code` property.
 * 
 * @param error - Unknown error to check
 * @returns True if error is an Error with a code property
 */
export function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return (
    error instanceof Error &&
    typeof (error as unknown as Record<string, unknown>)['code'] === 'string'
  );
}

/**
 * Type guard to check if an error has a `name` property.
 * 
 * @param error - Unknown error to check
 * @returns True if error is an Error with a name property
 */
export function isErrorWithName(error: unknown): error is Error & { name: string } {
  return (
    error instanceof Error &&
    typeof error.name === 'string'
  );
}

/**
 * Type guard to check if an error has a specific property.
 * 
 * @param error - Unknown error to check
 * @param prop - Property name to check for
 * @returns True if error has the specified property
 */
export function hasErrorProperty<T extends string>(
  error: unknown,
  prop: T
): error is Record<T, unknown> {
  return (
    error !== null &&
    error !== undefined &&
    typeof error === 'object' &&
    prop in error
  );
}

/**
 * Safely get a property from an error object.
 * 
 * @param error - Unknown error to extract property from
 * @param prop - Property name to extract
 * @returns Property value if it exists, undefined otherwise
 */
export function getErrorProperty<T extends string>(
  error: unknown,
  prop: T
): unknown {
  if (hasErrorProperty(error, prop)) {
    return error[prop];
  }
  return undefined;
}

/**
 * Create a typed error extension helper for adding custom properties to Error objects.
 * This provides a type-safe way to extend errors without using `as any`.
 * 
 * @param error - Error to extend
 * @param props - Properties to add to the error
 * @returns Error with extended properties
 */
export function extendError<T extends Record<string, unknown>>(
  error: Error,
  props: T
): Error & T {
  // Use Object.assign to add properties in a type-safe way
  return Object.assign(error, props) as Error & T;
}
