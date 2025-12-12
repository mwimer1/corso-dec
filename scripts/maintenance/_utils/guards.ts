/**
 * @fileoverview Type guards for exactOptionalPropertyTypes compliance
 * @description Utilities to safely handle optional properties and type checking
 */

/**
 * Checks if a value is defined (not null or undefined)
 */
export const isDefined = <T>(v: T | undefined | null): v is T =>
  v !== undefined && v !== null;

/**
 * Checks if a value is a function
 */
export const isFn = (v: unknown): v is (...args: any[]) => any =>
  typeof v === 'function';

/**
 * Checks if a value is a string and not empty
 */
export const isNonEmptyString = (v: unknown): v is string =>
  typeof v === 'string' && v.length > 0;

