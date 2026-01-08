"use client";

import { useUser } from '@clerk/nextjs';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useChat } from '../hooks/use-chat';
import { useUsageLimits } from '../hooks/use-usage-limits';
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
  // Transient scope: null = no active button, 'default' = default presets, other = scope-specific presets
  const [scope, setScope] = useState<ChatScope | null>(null);
  const [showPresets, setShowPresets] = useState(false);
  
  // Fetch usage limits once when Deep Research is enabled (consolidated hook)
  const usageLimits = useUsageLimits(deepResearch);

  // Calculate preferredTable based on scope (only for non-default scopes)
  const preferredTableFromScope = useMemo<'projects' | 'companies' | 'addresses' | undefined>(() => {
    if (!scope || scope === 'default') return undefined;
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

  // Reset preset visibility when transitioning from active chat to new chat
  const prevHasHistoryRef = useRef(hasHistory);
  useEffect(() => {
    // Only reset when transitioning from active chat (hasHistory: true) to new chat (hasHistory: false)
    if (prevHasHistoryRef.current && !hasHistory) {
      setShowPresets(false);
      setScope(null); // Reset to no active scope
    }
    prevHasHistoryRef.current = hasHistory;
  }, [hasHistory]);

  // Handle scope change - transient: show presets for clicked scope, but don't persist
  const handleScopeChange = useCallback((newScope: ChatScope) => {
    // Always set scope and show presets when button is clicked (transient behavior)
    setScope(newScope);
    setShowPresets(true);
  }, []);

  // Handle input focus - show default presets when input is focused in new chat
  // Only set default if no scope is active; otherwise preserve active scope
  const handleInputFocus = useCallback(() => {
    if (!hasHistory) {
      if (scope === null) {
        // No active scope: show default presets
        setScope('default');
        setShowPresets(true);
      } else {
        // Active scope exists: preserve it, just ensure presets are visible
        setShowPresets(true);
      }
    }
  }, [hasHistory, scope]);

  // Handle click outside - reset scope and hide presets
  const handleResetScope = useCallback(() => {
    setScope(null);
    setShowPresets(false);
  }, []);

  const [draft, setDraft] = useState<string>("");
  const [mode, setMode] = useState<ChatMode>(() => {
    try {
      const saved = typeof window !== 'undefined' ? window.localStorage.getItem('chat:mode') : null;
      if (saved && isChatMode(saved)) return saved;
    } catch {}
    return 'auto';
  });
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
    if (!hasHistory && scope && scope !== 'default') {
      const scopeLabel = scope === 'projects' ? 'projects' : scope === 'companies' ? 'companies' : 'addresses';
      return `Ask anything about ${scopeLabel}…`;
    }
    if (mode === 'auto') {
      return 'Ask anything…';
    }
    return `Ask anything about ${mode}…`;
  }, [mode, scope, hasHistory]);

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

  // Ref to composer input for focus restoration (accessibility)
  const composerInputRef = useRef<HTMLTextAreaElement | null>(null);
  
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
    
    // Scroll to bottom and restore focus after sending message (accessibility)
    requestAnimationFrame(() => {
      if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
      }
      // Restore focus to input for keyboard-only users
      composerInputRef.current?.focus();
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
      {hasHistory ? (
        // ACTIVE CHAT MODE: Standard layout with messages at top, composer at bottom
        <>
          <div 
            ref={scrollRef} 
            className={styles['messagesContainer']}
          >
            <div className={styles['messagesList']}>
              <ul role="log" aria-live="polite" aria-relevant="additions" className={styles['messagesListUl']}>
                {messages.map((m) => (
                  <li key={m.id}>
                    <MessageItem message={m} onSelectFollowUp={handleSelectFollowUp} />
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className={styles['composerContainer']}>
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
              scope={scope ?? 'default'}
              showPresets={showPresets}
              onPresetVisibilityChange={setShowPresets}
              onPresetSelect={(prompt) => {
                void sendMessage(applyModePrefix(prompt));
                requestAnimationFrame(() => {
                  if (scrollRef.current) {
                    scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                  }
                });
              }}
              onFocus={handleInputFocus}
              onResetScope={handleResetScope}
              hasHistory={hasHistory}
            />
            {error && (
              <div className="pt-2 text-sm text-destructive" role="alert" aria-live="polite">
                <span>
                  {error instanceof Error && error.message.includes('Deep Research') 
                    ? error.message 
                    : 'Something went wrong. Please try again.'}
                </span>
                <button 
                  onClick={() => { void retryLastMessage().catch(() => {/* no-op */}); }} 
                  className="ml-3 underline"
                  aria-label="Retry last message"
                >
                  Retry
                </button>
                <button 
                  onClick={clearError} 
                  className="ml-3 underline"
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </>
      ) : (
        // NEW CHAT MODE: Centered layout with welcome + composer + scope buttons as one unit
        <div 
          ref={scrollRef} 
          className={styles['messagesContainerCentered']}
        >
          <div className={styles['newChatCenteredWrapper']}>
            <div className={styles['welcomeContainer']}>
              <ChatWelcome onPreset={handleSelectFollowUp} {...(firstName ? { firstName } : {})} />
            </div>
            <div className={styles['composerContainerCentered']}>
              <ChatComposer
                value={draft}
                onChange={setDraft}
                onSend={() => { void handleSend(); }}
                disabled={isProcessing}
                placeholder={placeholder}
                onInputAutoGrow={(el) => {
                  autoGrow(el);
                  // Capture ref for focus restoration (accessibility)
                  composerInputRef.current = el;
                }}
                isProcessing={isProcessing}
                mode={mode}
                setMode={setMode}
                stop={stop}
                canSend={canSend}
                deepResearch={deepResearch}
                setDeepResearch={setDeepResearch}
                scope={scope ?? 'default'}
                showPresets={showPresets}
                onPresetVisibilityChange={setShowPresets}
                onPresetSelect={(prompt) => {
                  void sendMessage(applyModePrefix(prompt));
                  requestAnimationFrame(() => {
                    if (scrollRef.current) {
                      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
                    }
                  });
                }}
                onFocus={handleInputFocus}
                onResetScope={handleResetScope}
                hasHistory={hasHistory}
              />
              <div className="mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl mt-4 flex flex-col items-center gap-3">
                <ChatScopeButtons
                  activeScope={scope}
                  onScopeChange={handleScopeChange}
                />
              </div>
            </div>
            {error && (
              <div className="pt-2 text-sm text-destructive" role="alert" aria-live="polite">
                <span>
                  {error instanceof Error && error.message.includes('Deep Research') 
                    ? error.message 
                    : 'Something went wrong. Please try again.'}
                </span>
                <button 
                  onClick={() => { void retryLastMessage().catch(() => {/* no-op */}); }} 
                  className="ml-3 underline"
                  aria-label="Retry last message"
                >
                  Retry
                </button>
                <button 
                  onClick={clearError} 
                  className="ml-3 underline"
                  aria-label="Dismiss error"
                >
                  Dismiss
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Keep named export for backward compatibility
export { ChatWindow };

