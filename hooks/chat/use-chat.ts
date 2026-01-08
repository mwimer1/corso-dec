'use client';
// hooks/chat/use-chat.ts
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
import { useUser } from '@clerk/nextjs';

/* -------------------------------------------------------------------------- */
/* Types                                                                      */
/* -------------------------------------------------------------------------- */

interface UseChatOptions {
  maxMessages?: number;
  persistHistory?: boolean;
  autoSave?: boolean;
  autoSaveDelay?: number;
  preferredTable?: 'projects' | 'companies' | 'addresses';
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
  const timer = useRef<NodeJS.Timeout>();

  return useCallback(
    (...args: Args) => {
      if (timer.current) clearTimeout(timer.current);
      timer.current = setTimeout(() => cb(...args), delay);
    },
    [cb, delay]
  );
}

type AIChunk = {
  assistantMessage: ChatMessage;
  detectedTableIntent: 'projects' | 'companies' | 'addresses' | null;
  error: string | null;
};

type StreamOrPromise = AsyncIterable<AIChunk> | Promise<AIChunk>;

const isIterable = <T>(v: unknown): v is AsyncIterable<T> =>
  !!v && typeof (v as Record<symbol, unknown>)[Symbol.asyncIterator] === 'function';

/* -------------------------------------------------------------------------- */
/* Hook                                                                       */
/* -------------------------------------------------------------------------- */

export function useChat(opts: UseChatOptions = {}): UseChatReturn {
  const { maxMessages = 100, persistHistory = true, autoSave = true, autoSaveDelay = 1_000, preferredTable } = opts;
  const { user: _user } = useUser();

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
      return { ...initial, messages: loadRecentChatHistory(maxMessages) };
    } catch (err) {
      logger.error('[useChat] history load failed', { err });
      return initial;
    }
  });

  const { messages, isProcessing, detectedTable, error, lastUserMsg } = state;

  const abortRef = useRef<AbortController>();

  /* ------------------- debounced history save --------------------------- */

  const saveHistoryNow = useCallback(
    (msgs: ChatMessage[]) => {
      if (!persistHistory) return;
      try {
        saveChatHistory(msgs.slice(-maxMessages));
      } catch (err) {
        logger.error('[useChat] history save failed', { err });
      }
    },
    [maxMessages, persistHistory]
  );

  const debouncedSave = useDebounce(saveHistoryNow, autoSaveDelay);

  useEffect(() => {
    if (autoSave && messages.length) debouncedSave(messages);
  }, [messages, autoSave, debouncedSave]);

  /* ----------------------------- send ----------------------------------- */

  const sendMessage = useCallback(
    async (content: string) => {
      dispatch({ type: 'set_error', payload: null });
      dispatch({ type: 'set_processing', payload: true });

      const validation: ChatValidationResult = validateUserMessage(content);
      if (!validation.success) {
        const vErr = new ApplicationError({
          message: validation.error.message,
          code: validation.error.code,
          category: ErrorCategory.VALIDATION,
          severity: ErrorSeverity.WARNING,
        });
        dispatch({ type: 'set_error', payload: vErr });
        dispatch({
          type: 'add_message',
          payload: {
            id: uuid(),
            type: 'assistant',
            content: `⚠️ ${vErr.message}`,
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
          abortRef.current.signal
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
        dispatch({
          type: 'update_assistant_message',
          payload: { ...chunk.assistantMessage, id: assistantId },
        });

        if (chunk.detectedTableIntent) {
          dispatch({ type: 'set_detected_table', payload: chunk.detectedTableIntent });
        }

        if (chunk.error) {
          const aiErr = new ApplicationError({
            message: chunk.error,
            code: 'AI_RESPONSE_ERROR',
            category: ErrorCategory.API,
            severity: ErrorSeverity.ERROR,
          });
          dispatch({ type: 'set_error', payload: aiErr });
          reportError(aiErr);
        }
      }

      function handleFatal(err: unknown): void {
        const aborted = err instanceof Error && err.name === 'AbortError';

        if (aborted) {
          dispatch({
            type: 'update_assistant_message',
            payload: {
              id: assistantId,
              content: 'The operation was aborted',
              isError: true,
            },
          });
          return;
        }

        const appErr =
          err instanceof ApplicationError
            ? err
            : new ApplicationError({
                message: err instanceof Error ? err.message : 'Processing failed',
                code: 'CHAT_PROCESSING_ERROR',
                category: ErrorCategory.API,
                severity: ErrorSeverity.ERROR,
                ...(err instanceof Error ? { originalError: err } : {}),
              });

        dispatch({ type: 'set_error', payload: appErr });
        reportError(appErr);

        dispatch({
          type: 'update_assistant_message',
          payload: {
            id: assistantId,
            content: '⚠️ Something went wrong',
            isError: true,
          },
        });
      }
    },
    [preferredTable]
  );

  /* ----------------------- convenience actions ------------------------- */

  const clearChat = useCallback(() => {
    dispatch({ type: 'clear' });
    if (persistHistory) clearLocalChatHistory();
    abortRef.current?.abort();
  }, [persistHistory]);

  const saveHistory = useCallback(() => saveHistoryNow(messages), [messages, saveHistoryNow]);

  const loadHistory = useCallback(() => {
    if (!persistHistory) return;
    try {
      dispatch({ type: 'set_messages', payload: loadRecentChatHistory(maxMessages) });
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
  }, [persistHistory, maxMessages]);

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


