/**
 * @fileoverview Type utilities for Response and NextResponse handling
 * @description Provides type-safe utilities for working with Response | NextResponse unions
 *              and normalizing Response to NextResponse when needed.
 */

import { NextResponse } from 'next/server';

/**
 * Type alias for Response-like types (Response or NextResponse).
 * Used in middleware and route handlers that need to handle both types.
 */
export type ResponseLike = Response | NextResponse;

/**
 * Type guard to check if a response is a NextResponse instance.
 * 
 * @param response - Response or NextResponse to check
 * @returns True if response is a NextResponse instance
 */
export function isNextResponse(response: ResponseLike): response is NextResponse {
  // NextResponse extends Response, so we check for NextResponse-specific properties
  // Check for constructor name or instanceof check
  return response instanceof NextResponse || 'cookies' in response;
}

/**
 * Normalizes a Response to NextResponse if needed.
 * If the response is already a NextResponse, returns it unchanged.
 * Otherwise, creates a new NextResponse with the same properties.
 * 
 * @param response - Response or NextResponse to normalize
 * @returns NextResponse instance
 */
export function normalizeToNextResponse(response: ResponseLike): NextResponse {
  if (isNextResponse(response)) {
    return response;
  }

  // Clone to avoid stream-lock issues
  const cloned = response.clone();

  return new NextResponse(cloned.body ?? null, {
    status: cloned.status,
    statusText: cloned.statusText,
    headers: cloned.headers,
  });
}
