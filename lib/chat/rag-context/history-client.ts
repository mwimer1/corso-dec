// lib/chat/rag-context/history-client.ts
// Client-only helpers for local chat history persistence

"use client";

import { logger } from '@/lib/monitoring';
import type { ChatMessage } from '@/types/chat';

const CHAT_HISTORY_KEY = 'corso-chat-history';

export function loadRecentChatHistory(maxMessages: number = 50): ChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const stored = localStorage.getItem(CHAT_HISTORY_KEY);
    if (!stored) return [];
    const messages = JSON.parse(stored) as ChatMessage[];
    return Array.isArray(messages) ? messages.slice(-maxMessages) : [];
  } catch (error) {
    logger.error('Failed to load chat history from localStorage', { error });
    return [];
  }
}

export function saveChatHistory(messages: ChatMessage[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(messages));
  } catch (error) {
    logger.error('Failed to save chat history to localStorage', { error });
  }
}

export function clearLocalChatHistory(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(CHAT_HISTORY_KEY);
  } catch (error) {
    logger.error('Failed to clear chat history from localStorage', { error });
  }
}



