// lib/integrations/openai/chat-logging.ts
// Sprint 5: Structured logging utilities for chat/tool calls with PII redaction

import 'server-only';

import { getRequestId } from '@/lib/middleware/http/request-id';
import { logger } from '@/lib/monitoring';
import { maskSensitiveData } from '@/lib/security/utils/masking';
import type { NextRequest } from 'next/server';

/**
 * Hash an orgId to a short, stable identifier for logging
 * Uses FNV-1a hash for fast, deterministic hashing
 */
function hashOrgId(orgId: string): string {
  // Simple hash function (FNV-1a inspired, similar to query-utils)
  let hash = 0x811c9dc5;
  for (let i = 0; i < orgId.length; i++) {
    hash ^= orgId.charCodeAt(i);
    hash += (hash << 1) + (hash << 4) + (hash << 7) + (hash << 8) + (hash << 24);
    hash = hash >>> 0; // Convert to unsigned 32-bit
  }
  return hash.toString(16).padStart(8, '0');
}

/**
 * Redact PII patterns from SQL queries for logging
 * Removes email addresses, phone numbers, and other obvious PII
 */
function redactPIIFromSQL(sql: string): string {
  let redacted = sql;
  
  // Redact email addresses
  redacted = redacted.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]');
  
  // Redact phone numbers (various formats)
  redacted = redacted.replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]');
  redacted = redacted.replace(/\b\+?\d{1,3}[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[PHONE]');
  
  // Redact SSN-like patterns
  redacted = redacted.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]');
  
  // Redact credit card-like patterns
  redacted = redacted.replace(/\b\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}\b/g, '[CARD]');
  
  return redacted;
}

/**
 * Truncate SQL query for logging (max length: 500 chars)
 */
function truncateSQL(sql: string, maxLength: number = 500): string {
  if (sql.length <= maxLength) return sql;
  return sql.substring(0, maxLength) + '...[truncated]';
}

/**
 * Normalize SQL for logging: truncate and redact PII
 */
export function normalizeSQLForLogging(sql: string): string {
  const redacted = redactPIIFromSQL(sql);
  return truncateSQL(redacted, 500);
}

/**
 * Log tool call execution
 */
export function logToolCall(options: {
  req?: NextRequest;
  orgId: string;
  toolName: string;
  sql?: string;
  normalizedSQL?: string;
  allowDenyReason?: string;
  rowsReturned?: number;
  durationMs: number;
  success: boolean;
  error?: Error | string;
}): void {
  const {
    req,
    orgId,
    toolName,
    sql,
    normalizedSQL,
    allowDenyReason,
    rowsReturned,
    durationMs,
    success,
    error,
  } = options;
  
  const requestId = req ? getRequestId(req) : undefined;
  const orgIdHash = hashOrgId(orgId);
  
  const logData: Record<string, unknown> = {
    event: 'tool_call',
    toolName,
    orgIdHash, // Hashed, not raw
    durationMs: Math.round(durationMs),
    success,
  };
  
  if (requestId) logData['requestId'] = requestId;
  if (normalizedSQL) logData['normalizedSQL'] = normalizedSQL;
  else if (sql) logData['normalizedSQL'] = normalizeSQLForLogging(sql);
  if (allowDenyReason) logData['allowDenyReason'] = allowDenyReason;
  if (rowsReturned !== undefined) logData['rowsReturned'] = rowsReturned;
  if (error) {
    logData['error'] = error instanceof Error ? error.message : String(error);
    logData['errorType'] = error instanceof Error ? error.constructor.name : typeof error;
  }
  
  // Mask any sensitive data that might have leaked through
  const safeLogData = maskSensitiveData(logData);
  
  if (success) {
    logger.info('Tool call executed', safeLogData);
  } else {
    logger.warn('Tool call failed', safeLogData);
  }
}

/**
 * Log tool loop termination
 */
export function logToolLoopTermination(options: {
  req?: NextRequest;
  orgId: string;
  reason: 'max_tool_calls' | 'timeout' | 'openai_error' | 'validation_error' | 'completed' | 'aborted';
  toolCallCount: number;
  maxToolCalls: number;
  durationMs: number;
  error?: Error | string;
}): void {
  const {
    req,
    orgId,
    reason,
    toolCallCount,
    maxToolCalls,
    durationMs,
    error,
  } = options;
  
  const requestId = req ? getRequestId(req) : undefined;
  const orgIdHash = hashOrgId(orgId);
  
  const logData: Record<string, unknown> = {
    event: 'tool_loop_termination',
    reason,
    orgIdHash, // Hashed, not raw
    toolCallCount,
    maxToolCalls,
    durationMs: Math.round(durationMs),
  };
  
  if (requestId) logData['requestId'] = requestId;
  if (error) {
    logData['error'] = error instanceof Error ? error.message : String(error);
    logData['errorType'] = error instanceof Error ? error.constructor.name : typeof error;
  }
  
  const safeLogData = maskSensitiveData(logData);
  
  if (reason === 'completed') {
    logger.info('Tool loop completed', safeLogData);
  } else if (reason === 'max_tool_calls') {
    logger.warn('Tool loop reached max calls limit', safeLogData);
  } else {
    logger.error('Tool loop terminated with error', safeLogData);
  }
}
