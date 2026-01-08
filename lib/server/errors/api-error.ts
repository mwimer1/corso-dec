// lib/shared/errors/api-error.ts
import { NextResponse } from 'next/server';

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_JSON'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'HEALTH_CHECK_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'
  | 'UNAUTHENTICATED'
  | 'MISSING_ORG_CONTEXT'
  | 'INTERNAL_DATABASE_ERROR';

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};


export const fail = (error: ApiError, init?: ResponseInit) =>
  NextResponse.json<{ success: false; error: ApiError }>(
    { success: false, error },
    { status: init?.status ?? 500, ...init },
  );



