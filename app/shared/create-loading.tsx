import { RouteLoading } from "@/components";

/**
 * Creates a reusable loading component for route groups.
 * 
 * @param message - Loading message to display to users
 * @returns Loading component for use in route groups
 * 
 * @example
 * ```tsx
 * // app/(auth)/loading.tsx
 * import { createLoading } from '@/app/shared/create-loading';
 * export default createLoading('Loading authentication...');
 * ```
 */
export function createLoading(message: string) {
  return function Loading() {
    return <RouteLoading message={message} />;
  };
}
