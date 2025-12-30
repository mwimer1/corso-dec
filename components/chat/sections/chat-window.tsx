"use client";

import { useChat } from '../hooks/use-chat';
import { isChatMode, type ChatMode } from '../lib/chat-mode';
import { useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ChatWelcome from '../widgets/chat-welcome';
import { MessageItem } from '../widgets/message-item';

// Move dynamic import outside component to prevent remounting on re-renders
const ChatComposer = dynamic(() => import('./chat-composer'), { ssr: false });

export default function ChatWindow() {
  const { messages, isProcessing, sendMessage, stop, error, clearError, retryLastMessage } = useChat({ persistHistory: true, autoSave: true });
  const { user } = useUser();

  const [draft, setDraft] = useState<string>("");
  const [mode, setMode] = useState<ChatMode>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('chat:mode') : null;
      if (saved && isChatMode(saved)) return saved;
    } catch {}
    return 'projects';
  });
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstName = user?.firstName;
  const hasHistory = messages.length > 0;
  const PREFIX_MODE = true;
  const applyModePrefix = useCallback((t: string) => (PREFIX_MODE ? `[mode:${mode}] ${t}` : t), [mode, PREFIX_MODE]);
  const placeholder = useMemo(() => `Ask anything about ${mode}…`, [mode]);

  // Track hydration state to conditionally render placeholder
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Smooth autoscroll to bottom when messages change (only if user is near bottom)
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    // Only scroll if user is near bottom (within ~100px)
    const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
    if (distanceFromBottom < 100) {
      // Use rAF to wait for DOM paint
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [messages.length]);

  const canSend = useMemo(() => draft.trim().length > 0 && !isProcessing, [draft, isProcessing]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || isProcessing) return;
    setDraft("");
    await sendMessage(applyModePrefix(text));
  }, [draft, isProcessing, sendMessage, applyModePrefix]);

  // Key handling and IME composition are handled in the client-only composer

  const handleSelectFollowUp = useCallback((text: string) => {
    // Mirror prior UX: send immediately
    void sendMessage(applyModePrefix(text));
  }, [sendMessage, applyModePrefix]);

  useEffect(() => {
    try { if (typeof window !== 'undefined') window.localStorage.setItem('chat:mode', mode); } catch {}
  }, [mode]);

  // Auto-expand textarea with rAF and computed lineHeight to avoid layout thrash
  const autoGrow = useCallback((el: HTMLTextAreaElement | null) => {
    if (!el) return;
    const computed = getComputedStyle(el);
    const lineHeightStr = computed.lineHeight;
    let lineHeight = 20;
    if (lineHeightStr && lineHeightStr.endsWith('px')) {
      const parsed = parseFloat(lineHeightStr.replace('px', ''));
      if (!Number.isNaN(parsed) && parsed > 0) lineHeight = parsed;
    }
    const paddingTop = parseFloat(computed.paddingTop || '0');
    const paddingBottom = parseFloat(computed.paddingBottom || '0');
    const maxHeight = Math.round(lineHeight * 6 + paddingTop + paddingBottom);

    window.requestAnimationFrame(() => {
      el.style.height = 'auto';
      const next = Math.min(el.scrollHeight, maxHeight);
      el.style.height = `${next}px`;
      el.style.overflowY = el.scrollHeight > next ? 'auto' : 'hidden';
    });
  }, []);

  // The client composer calls `onInputAutoGrow` for the textarea; no local ref here

  return (
    <div
      className="flex flex-col flex-1 min-h-0"
      // tokenized chat surface vars: presets/bubbles/composer border widths
      style={
        {
          '--chat-bubble-asst-border': '1px',
          '--chat-preset-border': '1px',
          '--chat-composer-border': '1px',
        } as React.CSSProperties
      }
    >
      {/* Messages list */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto bg-background flex flex-col justify-end">
        {hasHistory ? (
          <div className="mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl px-6 py-4">
            <ul role="log" aria-live="polite" aria-relevant="additions" className="space-y-4">
              {messages.map((m) => (
                <li key={m.id}>
                  <MessageItem message={m} onSelectFollowUp={handleSelectFollowUp} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl px-6 pt-6 pb-3">
            <ChatWelcome onPreset={handleSelectFollowUp} {...(firstName ? { firstName } : {})} />
          </div>
        )}
      </div>

      {/* Composer — server placeholder + client-only composer */}
      <div className="bg-background px-6 pt-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] flex-shrink-0 border-t-[var(--chat-composer-border)] border-border">
        {/* Server-only placeholder to preserve layout pre-hydration; mark as region for a11y */}
        {!hydrated && (
          <div className="mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl rounded-2xl bg-surface p-3 shadow-sm" role="region" aria-hidden="true">
            {/* Empty shell matches sizing of composer */}
          </div>
        )}
        {/* Dynamic client-only composer — hydrates on client only */}
        <ChatComposer
          value={draft}
          onChange={setDraft}
          onSend={() => { void handleSend(); }}
          disabled={isProcessing}
          placeholder={placeholder}
          onInputAutoGrow={autoGrow}
          isProcessing={isProcessing}
          mode={mode}
          setMode={setMode}
          stop={stop}
          canSend={canSend}
        />
        {error && (
          <div className="pt-2 text-sm text-destructive">
            Something went wrong.
            <button onClick={() => { void retryLastMessage().catch(() => {/* no-op */}); }} className="ml-3 underline">Retry</button>
            <button onClick={clearError} className="ml-3 underline">Dismiss</button>
          </div>
        )}
      </div>
    </div>
  );
}

// Keep named export for backward compatibility
export { ChatWindow };
