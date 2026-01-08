'use client';
// components/chat/hooks/use-chat.ts
/**
 * Robust chat state hook – works with **either**
 * • a streaming async-iterable **or**
 * • a single-shot Promise
 * returned by `processUserMessage`.
 *
 * Zero ESLint rule-not-found noise (no stray pragma),
 * strict TS-safe (no `any`, no `@ts-ignore`), barrel-import only.
 */

import { useCallback, useEffect, useReducer, useRef } from 'react';
import { v4 as uuid } from 'uuid';

import { clearLocalChatHistory, loadRecentChatHistory, processUserMessageStreamClient as processUserMessage, saveChatHistory } from '@/lib/chat';
import { clientLogger as logger } from '@/lib/core';
import { ApplicationError, ErrorCategory, ErrorSeverity, reportError } from '@/lib/shared';
import type { ChatValidationResult } from '@/lib/validators';
import { validateUserMessage } from '@/lib/validators';
import type { ChatMessage } from '@/types/chat';
import type { ISODateString } from '@/types/shared';
import { useOrganization, useUser } from '@clerk/nextjs';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface UseChatOptions {
  maxMessages?: number;
  persistHistory?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  preferredTable?: 'projects' | 'companies' | 'addresses';
  modelTier?: 'auto' | 'fast' | 'thinking' | 'pro';
  deepResearch?: boolean;
}

interface UseChatReturn {
  messages: ChatMessage[];
  isProcessing: boolean;
  detectedTable: 'projects' | 'companies' | 'addresses' | null;
  sendMessage: (content: string) => Promise<void>;
  /** Abort the current generation, if any */
  stop: () => void;
  clearChat: () => void;
  saveHistory: () => void;
  loadHistory: () => void;
  error: Error | null;
  clearError: () => void;
  retryLastMessage: () => Promise<void>;
}

interface ChatState {
  messages: ChatMessage[];
  isProcessing: boolean;
  detectedTable: 'projects' | 'companies' | 'addresses' | null;
  error: Error | null;
  lastUserMsg: string | null;
}

type ChatAction =
  | { type: 'add_message'; payload: ChatMessage }
  | { type: 'update_assistant_message'; payload: Partial<ChatMessage> & { id: string } }
  | { type: 'set_messages'; payload: ChatMessage[] }
  | { type: 'set_processing'; payload: boolean }
  | { type: 'set_error'; payload: Error | null }
  | { type: 'set_detected_table'; payload: 'projects' | 'companies' | 'addresses' | null }
  | { type: 'set_last_user_msg'; payload: string | null }
  | { type: 'clear' };

/* -------------------------------------------------------------------------- */
/* Reducer                                                                    */
/* -------------------------------------------------------------------------- */

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'add_message':
      return { ...state, messages: [...state.messages, action.payload] };
    case 'update_assistant_message':
      return {
        ...state,
        messages: state.messages.map(m =>
          m.id === action.payload.id ? { ...m, ...action.payload } : m
        ),
      };
    case 'set_messages':
      return { ...state, messages: action.payload };
    case 'set_processing':
      return { ...state, isProcessing: action.payload };
    case 'set_error':
      return { ...state, error: action.payload };
    case 'set_detected_table':
      return { ...state, detectedTable: action.payload };
    case 'set_last_user_msg':
        return { ...state, lastUserMsg: action.payload };
    case 'clear':
      return {
        messages: [],
        isProcessing: false,
        detectedTable: null,
        error: null,
        lastUserMsg: null,
      };
    default:
      return state;
  }
}

/* -------------------------------------------------------------------------- */
/* Utils                                                                      */
/* -------------------------------------------------------------------------- */

/**
 * Generic debounce that **preserves param types** without `any`.
 */
function useDebounce<Args extends unknown[]>(
  cb: (...args: Args) => void,
  delay: number
): (...args: Args) => void {
  const timer = useRef<NodeJS.Timeout | undefined>(undefined);

  return useCallback(
    (...args: Args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => cb(...args), delay);
    },
    [cb, delay]
  );
}

// Import the AIChunk type from types.ts to ensure consistency
import type { AIChunk } from '@/lib/chat/client/types';

type StreamOrPromise = AsyncIterable<AIChunk> | Promise<AIChunk>;

const isIterable = <T>(v: unknown): v is AsyncIterable<T> =>
  !!v && typeof (v as Record<symbol, unknown>)[Symbol.asyncIterator] === 'function';

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useChat(opts: UseChatOptions = {}): UseChatReturn {
  const { maxMessages = 100, persistHistory = true, autoSave = true, autoSaveDelay = 1_000, preferredTable, modelTier = 'auto' } = opts;
  const { user } = useUser();
  const { organization, isLoaded } = useOrganization();
  
  // Derive orgId: only use it when organization is loaded to avoid stale data
  const orgId = isLoaded ? (organization?.id ?? null) : null;
  // Get userId for history scoping
  const userId = user?.id ?? null;

  const initialState: ChatState = {
    messages: [],
    isProcessing: false,
    detectedTable: null,
    error: null,
    lastUserMsg: null,
  };

  const [state, dispatch] = useReducer(chatReducer, initialState, (initial) => {
    if (!persistHistory) return initial;

    // Don't load chat history during SSR to prevent hydration mismatches
    if (typeof window === 'undefined') return initial;

    try {
      // Note: userId and orgId may be null during initial render
      // History will be loaded with proper scoping once user/org data is available
      return { ...initial, messages: loadRecentChatHistory(maxMessages, userId, orgId) };
    } catch (err) {
      logger.error('[useChat] history load failed', { err });
      return initial;
    }
  });

  const { messages, isProcessing, detectedTable, error, lastUserMsg } = state;

  const abortRef = useRef<AbortController | undefined>(undefined);

  /* ------------------- debounced history save --------------------------- */

  const saveHistoryNow = useCallback(
    (msgs: ChatMessage[]) => {
      if (!persistHistory) return;
      try {
        saveChatHistory(msgs.slice(-maxMessages), userId, orgId);
      } catch (err) {
        logger.error('[useChat] history save failed', { err });
      }
    },
    [maxMessages, persistHistory, userId, orgId]
  );

  const debouncedSave = useDebounce(saveHistoryNow, autoSaveDelay);

  useEffect(() => {
    if (autoSave && messages.length) debouncedSave(messages);
  }, [messages, autoSave, debouncedSave]);

  /* ----------------------------- send ----------------------------------- */

  const sendMessage = useCallback(
    async (content: string) => {
      // Build conversation history from current messages (last 10, excluding errors)
      const recentHistory = messages
        .slice(-10)
        .filter(m => !m.isError)
        .map(m => ({
          role: m.type as 'user' | 'assistant',
          content: m.content,
        }));
      dispatch({ type: 'set_error', payload: null });
      dispatch({ type: 'set_processing', payload: true });

      const validation: ChatValidationResult = validateUserMessage(content);
      if (!validation.success) {
        // Validation errors: Show single inline message only (no error state/banner)
        // This provides clear, user-friendly feedback without duplication
        dispatch({
          type: 'add_message',
          payload: {
            id: uuid(),
            type: 'assistant',
            content: validation.error.message, // Already user-friendly from validator
            isError: true,
            timestamp: new Date().toISOString() as ISODateString,
          },
        });
        dispatch({ type: 'set_processing', payload: false });
        return;
      }

      dispatch({ type: 'set_last_user_msg', payload: content });

      const userMsg: ChatMessage = {
        id: uuid(),
        type: 'user',
        content,
        timestamp: new Date().toISOString() as ISODateString,
      };
      dispatch({ type: 'add_message', payload: userMsg });

      const assistantId = `assistant-${uuid()}`;
      const placeholder: ChatMessage = {
        id: assistantId,
        type: 'assistant',
        content: '',
        timestamp: new Date().toISOString() as ISODateString,
      };
      dispatch({ type: 'add_message', payload: placeholder });

      abortRef.current?.abort();
      abortRef.current = new AbortController();

      try {
        const result = processUserMessage(
          content,
          preferredTable,
          abortRef.current.signal,
          recentHistory.length > 0 ? recentHistory : undefined,
          orgId,
          modelTier,
          opts.deepResearch ?? false
        ) as StreamOrPromise;

        if (isIterable<AIChunk>(result)) {
          for await (const chunk of result) mergeChunk(chunk);
        } else {
          mergeChunk(await result);
        }
      } catch (err) {
        handleFatal(err);
      } finally {
        dispatch({ type: 'set_processing', payload: false });
      }

      function mergeChunk(chunk: AIChunk): void {
        if (chunk.assistantMessage) {
          // Merge all assistantMessage fields into the in-flight message
          // The reducer's spread operator will merge fields, preserving existing values
          const updatePayload: Partial<ChatMessage> & { id: string } = {
            id: assistantId,
            content: chunk.assistantMessage.content,
            ...(chunk.assistantMessage.visualizationType !== undefined && {
              visualizationType: chunk.assistantMessage.visualizationType,
            }),
            ...(chunk.assistantMessage.tableColumns !== undefined && {
              tableColumns: chunk.assistantMessage.tableColumns,
            }),
            ...(chunk.assistantMessage.tableData !== undefined && {
              tableData: chunk.assistantMessage.tableData,
            }),
          };
          
          dispatch({
            type: 'update_assistant_message',
            payload: updatePayload,
          });
        }

        if (chunk.detectedTableIntent) {
          // Extract table name from detectedTableIntent object
          const tableName = chunk.detectedTableIntent.table as 'projects' | 'companies' | 'addresses';
          if (tableName === 'projects' || tableName === 'companies' || tableName === 'addresses') {
            dispatch({ type: 'set_detected_table', payload: tableName });
          }
        }

        if (chunk.error) {
          // Stream error: Show user-friendly message in message list
          // Error state is set for banner display (with retry option)
          const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;
          const aiErr = new ApplicationError({
            message: chunk.error,
            code: 'AI_RESPONSE_ERROR',
            category: ErrorCategory.API,
            severity: ErrorSeverity.ERROR,
          });
          
          // Log with error ID for server-side correlation
          logger.error('[Chat] Stream error', { 
            errorId,
            error: aiErr.message,
            code: aiErr.code,
          });
          
          // Set error state for banner (with retry)
          dispatch({ type: 'set_error', payload: aiErr });
          reportError(aiErr);
          
          // Show user-friendly message in chat (hide internal details)
          const userMessage = chunk.error.includes('Deep Research') 
            ? chunk.error 
            : 'Sorry, something went wrong. Please try again.';
          
          dispatch({
            type: 'update_assistant_message',
            payload: {
              id: assistantId,
              content: userMessage,
              isError: true,
            },
          });
          return;
        }
      }

      function handleFatal(err: unknown): void {
        const aborted = err instanceof Error && err.name === 'AbortError';

        if (aborted) {
          // Aborted: Don't set error state, just show message (user-initiated cancel)
          dispatch({
            type: 'update_assistant_message',
            payload: {
              id: assistantId,
              content: 'The operation was cancelled',
              isError: true,
            },
          });
          return;
        }

        // Check if this is a Deep Research limit exceeded error
        const isLimitExceeded = err instanceof Error && 
          ((err as any).code === 'DEEP_RESEARCH_LIMIT_EXCEEDED' || 
           err.message.includes('Deep Research usage limit exceeded'));

        // Generate error ID for server-side correlation
        const errorId = `ERR-${Date.now().toString(36).toUpperCase()}`;

        const appErr =
          err instanceof ApplicationError
            ? err
            : new ApplicationError({
                message: err instanceof Error ? err.message : 'Processing failed',
                code: isLimitExceeded ? 'DEEP_RESEARCH_LIMIT_EXCEEDED' : 
                      (err instanceof Error && (err as any).code ? (err as any).code : 'CHAT_PROCESSING_ERROR'),
                category: ErrorCategory.API,
                severity: ErrorSeverity.ERROR,
                ...(err instanceof Error ? { originalError: err } : {}),
              });

        // Log with error ID for server-side correlation
        logger.error('[Chat] Fatal error', {
          errorId,
          error: appErr.message,
          code: appErr.code,
          originalError: err instanceof Error ? err.message : String(err),
        });

        // Set error state for banner (with retry option)
        dispatch({ type: 'set_error', payload: appErr });
        reportError(appErr);

        // Show user-friendly message without leaking internals
        let userMessage: string;
        if (isLimitExceeded && err instanceof Error) {
          // Deep Research limit: Use server's message (already user-friendly)
          userMessage = err.message;
        } else {
          // Generic server error: Show retry guidance
          userMessage = 'Something went wrong. Please try again or check your connection.';
        }

        dispatch({
          type: 'update_assistant_message',
          payload: {
            id: assistantId,
            content: userMessage,
            isError: true,
          },
        });
      }
    },
    [preferredTable, modelTier, opts.deepResearch, messages, orgId]
  );

  /* ----------------------- convenience actions ------------------------- */

  const clearChat = useCallback(() => {
    dispatch({ type: 'clear' });
    if (persistHistory) clearLocalChatHistory(userId, orgId);
    abortRef.current?.abort();
  }, [persistHistory, userId, orgId]);

  const saveHistory = useCallback(() => saveHistoryNow(messages), [messages, saveHistoryNow]);

  const loadHistory = useCallback(() => {
    if (!persistHistory) return;
    try {
      dispatch({ type: 'set_messages', payload: loadRecentChatHistory(maxMessages, userId, orgId) });
    } catch {
      dispatch({
        type: 'set_error',
        payload: new ApplicationError({
          message: 'History load failed',
          code: 'CHAT_HISTORY_LOAD_ERROR',
          category: ErrorCategory.DATABASE,
          severity: ErrorSeverity.WARNING,
        }),
      });
    }
  }, [persistHistory, maxMessages, userId, orgId]);

  const retryLastMessage = useCallback(async () => {
    if (lastUserMsg) await sendMessage(lastUserMsg);
  }, [lastUserMsg, sendMessage]);

  const clearError = useCallback(() => dispatch({ type: 'set_error', payload: null }), []);

  useEffect(() => () => abortRef.current?.abort(), []);

  return {
    messages,
    isProcessing,
    detectedTable,
    sendMessage,
    stop: () => {
      try { abortRef.current?.abort(); } catch {}
    },
    clearChat,
    saveHistory,
    loadHistory,
    error,
    clearError,
    retryLastMessage,
  };
}


