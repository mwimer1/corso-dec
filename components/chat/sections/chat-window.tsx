"use client";

import { useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../hooks/use-chat';
import { isChatMode, type ChatMode } from '../lib/chat-mode';
import ChatWelcome from '../widgets/chat-welcome';
import { MessageItem } from '../widgets/message-item';
import { ChatScopeButtons, type ChatScope } from '../components/chat-scope-buttons';
import styles from '../chat.module.css';

// Move dynamic import outside component to prevent remounting on re-renders
const ChatComposer = dynamic(() => import('./chat-composer'), { ssr: false });

export default function ChatWindow() {
  const searchParams = useSearchParams();
  
  // Read modelTier from URL, default to 'auto'
  const modelTier = useMemo(() => {
    const param = searchParams?.get('model');
    if (param && ['auto', 'fast', 'thinking', 'pro'].includes(param)) {
      return param as 'auto' | 'fast' | 'thinking' | 'pro';
    }
    return 'auto';
  }, [searchParams]);

  const [deepResearch, setDeepResearch] = useState<boolean>(false);
  const [scope, setScope] = useState<ChatScope>('recommended');
  const [showPresets, setShowPresets] = useState(false);
  const [usageLimits, setUsageLimits] = useState<{ remaining: number; limit: number; currentUsage: number } | null>(null);

  // Calculate preferredTable based on scope (will be refined after we know hasHistory)
  const preferredTableFromScope = useMemo<'projects' | 'companies' | 'addresses' | undefined>(() => {
    if (scope === 'recommended') return undefined;
    return scope as 'projects' | 'companies' | 'addresses';
  }, [scope]);

  const { messages, isProcessing, sendMessage, stop, error, clearError, retryLastMessage, clearChat } = useChat({ 
    persistHistory: true, 
    autoSave: true,
    modelTier,
    deepResearch,
    ...(preferredTableFromScope ? { preferredTable: preferredTableFromScope } : {}),
  });
  const { user } = useUser();

  // Clear chat when ?new=true is in URL (e.g., when clicking Chat in sidebar)
  useEffect(() => {
    const isNewChat = searchParams?.get('new') === 'true';
    if (isNewChat) {
      clearChat();
    }
  }, [searchParams, clearChat]);

  // Determine if we have chat history (active chat vs new chat)
  const hasHistory = messages.length > 0;

  // Reset scope to 'recommended' and hide presets when transitioning from active chat to new chat
  useEffect(() => {
    if (!hasHistory && scope !== 'recommended') {
      setScope('recommended');
    }
    // Reset preset visibility when transitioning to new chat
    if (!hasHistory) {
      setShowPresets(false);
    }
  }, [hasHistory, scope]);

  // Handle scope change - show presets when scope button is clicked
  const handleScopeChange = useCallback((newScope: ChatScope) => {
    setScope(newScope);
    setShowPresets(true); // Show presets when scope button clicked
  }, []);

  const [draft, setDraft] = useState<string>("");
  const [mode, setMode] = useState<ChatMode>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('chat:mode') : null;
      if (saved && isChatMode(saved)) return saved;
    } catch {}
    return 'auto';
  });
  const [hydrated, setHydrated] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const firstName = user?.firstName;
  const PREFIX_MODE = true;
  // Only prefix with mode if it's not 'auto' - auto mode lets the AI determine the table
  const applyModePrefix = useCallback((t: string) => {
    if (!PREFIX_MODE) return t;
    // Don't prefix 'auto' mode - let the AI determine which table to use
    if (mode === 'auto') return t;
    return `[mode:${mode}] ${t}`;
  }, [mode, PREFIX_MODE]);
  const placeholder = useMemo(() => {
    // Use scope for placeholder in new chat mode, fallback to mode
    if (!hasHistory && scope !== 'recommended') {
      const scopeLabel = scope === 'projects' ? 'projects' : scope === 'companies' ? 'companies' : 'addresses';
      return `Ask anything about ${scopeLabel}…`;
    }
    if (mode === 'auto') {
      return 'Ask anything…';
    }
    return `Ask anything about ${mode}…`;
  }, [mode, scope, hasHistory]);

  // Track hydration state to conditionally render placeholder
  useEffect(() => {
    setHydrated(true);
  }, []);

  // Smooth autoscroll to bottom when messages change
  // In active chat mode, always scroll to bottom after new messages
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    
    if (hasHistory) {
      // Active chat: always scroll to bottom when messages change
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    } else {
      // New chat: only scroll if user is near bottom (within ~100px)
      const distanceFromBottom = el.scrollHeight - el.clientHeight - el.scrollTop;
      if (distanceFromBottom < 100) {
        requestAnimationFrame(() => {
          el.scrollTop = el.scrollHeight;
        });
      }
    }
  }, [messages.length, hasHistory]);

  const canSend = useMemo(() => draft.trim().length > 0 && !isProcessing, [draft, isProcessing]);

  // Fetch usage limits when Deep Research is enabled (for additional safety check)
  useEffect(() => {
    if (deepResearch) {
      const fetchLimits = async () => {
        try {
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
          const res = await fetch(`${baseUrl}/api/v1/ai/chat/usage-limits`, {
            credentials: 'include',
          });
          if (res.ok) {
            const data = await res.json();
            if (data.success && data.data) {
              setUsageLimits(data.data);
            }
          }
        } catch (err) {
          // Silently fail - limits are optional UI feedback
          console.warn('Failed to fetch usage limits:', err);
        }
      };
      void fetchLimits();
    } else {
      setUsageLimits(null);
    }
  }, [deepResearch]);

  const handleSend = useCallback(async () => {
    const text = draft.trim();
    if (!text || isProcessing) return;
    
    // Additional safety: prevent sending if Deep Research is enabled but quota exhausted
    if (deepResearch && usageLimits?.remaining === 0) {
      // This shouldn't happen if toggle is properly disabled, but defensive check
      return;
    }
    
    setDraft("");
    await sendMessage(applyModePrefix(text));
    
    // Scroll to bottom after sending message
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
  }, [draft, isProcessing, sendMessage, applyModePrefix, deepResearch, usageLimits]);

  // Key handling and IME composition are handled in the client-only composer

  const handleSelectFollowUp = useCallback((text: string) => {
    // Mirror prior UX: send immediately
    void sendMessage(applyModePrefix(text));
    
    // Scroll to bottom after sending preset
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
    });
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
    <div className={styles['chatWindow']}>
      {/* Messages list */}
      <div 
        ref={scrollRef} 
        className={hasHistory ? styles['messagesContainer'] : styles['messagesContainerCentered']}
      >
        {hasHistory ? (
          <div className={styles['messagesList']}>
            <ul role="log" aria-live="polite" aria-relevant="additions" className={styles['messagesListUl']}>
              {messages.map((m) => (
                <li key={m.id}>
                  <MessageItem message={m} onSelectFollowUp={handleSelectFollowUp} />
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <div className={styles['welcomeContainer']}>
            <ChatWelcome onPreset={handleSelectFollowUp} {...(firstName ? { firstName } : {})} />
          </div>
        )}
      </div>

      {/* Composer — server placeholder + client-only composer */}
      <div className={hasHistory ? styles['composerContainer'] : styles['composerContainerCentered']}>
        {/* Server-only placeholder to preserve layout pre-hydration; mark as region for a11y */}
        {!hydrated && (
          <div className={styles['composerPlaceholder']} role="region" aria-hidden="true">
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
          deepResearch={deepResearch}
          setDeepResearch={setDeepResearch}
          scope={scope}
          showPresets={showPresets}
          onPresetVisibilityChange={setShowPresets}
          onPresetSelect={(prompt) => {
            // Automatically send preset prompts
            void sendMessage(applyModePrefix(prompt));
            
            // Scroll to bottom after sending preset
            requestAnimationFrame(() => {
              if (scrollRef.current) {
                scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
              }
            });
          }}
          hasHistory={hasHistory}
        />
        {/* Scope buttons - only show in new chat mode (no history) */}
        {!hasHistory && (
          <div className="mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl mt-4 flex flex-col items-center gap-3">
            <ChatScopeButtons
              selectedScope={scope}
              onScopeChange={handleScopeChange}
            />
          </div>
        )}
        {error && (
          <div className="pt-2 text-sm text-destructive" role="alert">
            {error instanceof Error && error.message.includes('Deep Research') 
              ? error.message 
              : 'Something went wrong.'}
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

