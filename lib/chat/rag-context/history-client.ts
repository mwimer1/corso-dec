// lib/chat/rag-context/history-client.ts
// Client-only helpers for local chat history persistence

"use client";

import { logger } from '@/lib/monitoring';
import type { ChatMessage } from '@/types/chat';

/**
 * Generate a scoped localStorage key for chat history.
 * Includes orgId and userId to prevent cross-user/cross-org leakage on shared devices.
 * 
 * @param userId - User ID from Clerk (can be null for unauthenticated)
 * @param orgId - Organization ID (can be null for personal accounts)
 * @returns Scoped localStorage key
 */
function getChatHistoryKey(userId: string | null, orgId: string | null): string {
  const userPart = userId ?? 'no-user';
  const orgPart = orgId ?? 'no-org';
  return `corso-chat-history:${orgPart}:${userPart}`;
}

/**
 * Load recent chat history from localStorage, scoped by user and organization.
 * 
 * @param maxMessages - Maximum number of messages to return (default: 50)
 * @param userId - User ID from Clerk (required for scoping)
 * @param orgId - Organization ID (required for scoping)
 * @returns Array of chat messages
 */
export function loadRecentChatHistory(
  maxMessages: number = 50,
  userId: string | null = null,
  orgId: string | null = null
): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const key = getChatHistoryKey(userId, orgId);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    const messages = JSON.parse(stored) as ChatMessage[];
    return Array.isArray(messages) ? messages.slice(-maxMessages) : [];
  } catch (error) {
    logger.error('Failed to load chat history from localStorage', { error });
    return [];
  }
}

/**
 * Save chat history to localStorage, scoped by user and organization.
 * 
 * @param messages - Array of chat messages to save
 * @param userId - User ID from Clerk (required for scoping)
 * @param orgId - Organization ID (required for scoping)
 */
export function saveChatHistory(
  messages: ChatMessage[],
  userId: string | null = null,
  orgId: string | null = null
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getChatHistoryKey(userId, orgId);
    localStorage.setItem(key, JSON.stringify(messages));
  } catch (error) {
    logger.error('Failed to save chat history to localStorage', { error });
  }
}

/**
 * Clear chat history from localStorage, scoped by user and organization.
 * 
 * @param userId - User ID from Clerk (required for scoping)
 * @param orgId - Organization ID (required for scoping)
 */
export function clearLocalChatHistory(
  userId: string | null = null,
  orgId: string | null = null
): void {
  if (typeof window === 'undefined') return;
  try {
    const key = getChatHistoryKey(userId, orgId);
    localStorage.removeItem(key);
  } catch (error) {
    logger.error('Failed to clear chat history', { error });
  }
}
