// lib/api/ai/chat/messages.ts
// Server-only message building for AI chat endpoint

import 'server-only';

import type OpenAI from 'openai';
import { buildSystemPrompt } from './prompts';
import type { ChatRequest } from './request';

/**
 * Build conversation messages array for OpenAI Chat Completions API
 */
export function buildChatMessages(
  body: ChatRequest,
  cleanedContent: string,
  preferredTable: string | null,
  deepResearch?: boolean
): OpenAI.Chat.Completions.ChatCompletionMessageParam[] {
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [];
  
  // Add system prompt (with Deep Research mode if enabled)
  messages.push({
    role: 'system',
    content: buildSystemPrompt(preferredTable, deepResearch),
  });

  // Add conversation history (last 10 messages to avoid token limits)
  if (body.history && body.history.length > 0) {
    const recentHistory = body.history.slice(-10);
    for (const msg of recentHistory) {
      // Skip error messages from history
      if (msg.content.includes('⚠️')) continue;
      
      messages.push({
        role: msg.role,
        content: msg.content,
      });
    }
  }

  // Add current user message
  messages.push({
    role: 'user',
    content: cleanedContent,
  });

  return messages;
}

/**
 * Build input items array for OpenAI Responses API
 */
export function buildResponseInputItems(
  body: ChatRequest,
  cleanedContent: string
): any[] { // ResponseInputItem[] - using any due to pnpm multiple package version resolution
  const inputItems: any[] = [];
  
  // Add conversation history as messages (using EasyInputMessage format)
  if (body.history && body.history.length > 0) {
    const recentHistory = body.history.slice(-10);
    for (const msg of recentHistory) {
      // Skip error messages from history
      if (msg.content.includes('⚠️')) continue;
      
      if (msg.role === 'user' || msg.role === 'assistant') {
        // Use EasyInputMessage format - matches ResponseInputItem union type
        // Type assertion needed due to pnpm multiple package version resolution
        inputItems.push({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content,
        } as any);
      }
    }
  }
  
  // Add current user message
  // Type assertion needed due to pnpm multiple package version resolution
  inputItems.push({
    role: 'user',
    content: cleanedContent,
  } as any);

  return inputItems;
}
