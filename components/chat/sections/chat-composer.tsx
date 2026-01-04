"use client";

import { ArrowUpIcon, Badge } from '@/components';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import * as React from 'react';
import { publicEnv } from '@/lib/shared/config/client';
import type { ChatMode } from '../lib/chat-mode';
import { getPresetsForScope, type ChatScope, type ChatPreset } from '../lib/chat-presets';
import { cn } from '@/styles';

type ChatComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onInputAutoGrow?: (el: HTMLTextAreaElement | null) => void;
  isProcessing?: boolean;
  mode?: ChatMode; // Optional now since we're not using it for the dropdown
  setMode?: (m: ChatMode) => void; // Optional now
  stop?: () => void;
  canSend?: boolean;
  deepResearch?: boolean;
  setDeepResearch?: (enabled: boolean) => void;
  scope?: ChatScope; // Scope for showing presets
  onPresetSelect?: (prompt: string) => void; // Callback when preset is clicked
  hasHistory?: boolean; // Whether chat has message history (active chat mode)
};

function ChatComposer(props: ChatComposerProps) {
  // Provide defaults for required props to handle edge cases in tests
  const {
    value = '',
    onChange = () => {},
    onSend = () => {},
    disabled = false,
    placeholder,
    onInputAutoGrow,
    isProcessing = false,
    mode: _mode = 'auto',
    setMode: _setMode = () => {},
    stop,
    canSend = false,
    deepResearch = false,
    setDeepResearch = () => {},
    scope,
    onPresetSelect,
    hasHistory = false,
  } = props || {};
  
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const composerRef = React.useRef<HTMLDivElement | null>(null);
  const [isComposing, setIsComposing] = React.useState(false);
  const [usageLimits, setUsageLimits] = React.useState<{ remaining: number; limit: number; currentUsage: number } | null>(null);
  const [showPresets, setShowPresets] = React.useState(false);

  // Get presets for current scope
  const presets = React.useMemo(() => {
    if (!scope) return [];
    return getPresetsForScope(scope);
  }, [scope]);

  // Show presets when scope changes (auto-show) - but only in new chat mode
  React.useEffect(() => {
    // Always show presets in new chat mode when scope is set (including 'recommended')
    if (!hasHistory && scope) {
      const scopePresets = getPresetsForScope(scope);
      if (scopePresets.length > 0) {
        setShowPresets(true);
      } else {
        setShowPresets(false);
      }
    } else {
      setShowPresets(false);
    }
  }, [scope, hasHistory, presets.length]);

  // Close presets when clicking outside
  React.useEffect(() => {
    if (!showPresets) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        setShowPresets(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showPresets]);

  // Fetch usage limits when Deep Research is enabled
  React.useEffect(() => {
    if (deepResearch) {
      const fetchLimits = async () => {
        try {
          const baseUrl = publicEnv.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
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

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      if ((e.nativeEvent as any).isComposing || isComposing) return;
      e.preventDefault();
      onSend();
    }
  };

  const onCompositionStart = () => setIsComposing(true);
  const onCompositionEnd = () => setIsComposing(false);

  React.useEffect(() => {
    if (inputRef.current && onInputAutoGrow) onInputAutoGrow(inputRef.current);
  }, [value, onInputAutoGrow]);

  const handlePresetClick = React.useCallback((preset: ChatPreset) => {
    if (onPresetSelect) {
      onPresetSelect(preset.prompt);
      setShowPresets(false);
    }
  }, [onPresetSelect]);

  return (
    <div 
      ref={composerRef}
      className="relative mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl rounded-2xl bg-surface p-3 shadow-sm border-2 border-border focus-within:ring-1 focus-within:ring-border focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow z-10" 
      role="region" 
      aria-label="Message composer"
    >
      <textarea
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        placeholder={placeholder}
        aria-label="Chat message input"
        rows={1}
        onInput={(e) => onInputAutoGrow?.(e.currentTarget)}
        className="min-h-[44px] max-h-40 w-full resize-none rounded-md bg-transparent px-3 py-2 text-sm outline-none focus:outline-none focus-visible:outline-none"
        disabled={disabled}
      />

      <div className="mt-2 flex items-center justify-between" role="toolbar" aria-label="Composer actions">
        <div className="flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label={deepResearch ? 'Deep Research enabled' : 'Enable Deep Research'}
                className="h-9 w-9 rounded-md border border-border bg-surface inline-flex items-center justify-center hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
                title={deepResearch ? 'Deep Research enabled' : 'Enable Deep Research'}
              >
                <span aria-hidden className="text-[20px] leading-none">+</span>
              </button>
            </DropdownMenu.Trigger>
            <DropdownMenu.Portal>
              <DropdownMenu.Content
                side="top"
                sideOffset={6}
                align="start"
                className="z-[2000] min-w-[180px] border border-border shadow-lg p-1 rounded-md bg-background"
              >
                <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Deep Research
                </DropdownMenu.Label>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.CheckboxItem
                  checked={deepResearch}
                  onCheckedChange={(checked) => setDeepResearch(checked === true)}
                  className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-black/5 focus:bg-black/5 focus:outline-none"
                >
                  <DropdownMenu.ItemIndicator className="inline-flex items-center justify-center">
                    <Check className="h-4 w-4" />
                  </DropdownMenu.ItemIndicator>
                  <span className="flex-1">Deep Research</span>
                </DropdownMenu.CheckboxItem>
                {usageLimits && (
                  <>
                    <DropdownMenu.Separator className="my-1 h-px bg-border" />
                    <div className="px-2 py-1.5 text-xs text-muted-foreground">
                      <div className="flex items-center justify-between">
                        <span>Usage this month:</span>
                        <span className={usageLimits.remaining === 0 ? 'text-destructive font-medium' : ''}>
                          {usageLimits.currentUsage} / {usageLimits.limit}
                        </span>
                      </div>
                      {usageLimits.remaining > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          {usageLimits.remaining} remaining
                        </div>
                      )}
                      {usageLimits.remaining === 0 && (
                        <div className="mt-1 text-xs text-destructive">
                          Limit reached for this month
                        </div>
                      )}
                    </div>
                  </>
                )}
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {deepResearch && (
            <Badge color="secondary" aria-hidden="true">
              Deep Research
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 relative z-20">
          <button
            type="button"
            aria-label="Send"
            onClick={() => onSend()}
            disabled={!canSend}
            className="h-9 w-9 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center disabled:opacity-50 hover:shadow-sm active:opacity-90 relative z-30"
            aria-describedby="chat-send-hint"
          >
            <ArrowUpIcon pixelSize={14} />
          </button>
          <span id="chat-send-hint" className="sr-only">Enter to send · Shift+Enter for newline</span>
          {isProcessing && (
            <button
              type="button"
              onClick={() => { try { stop?.(); } catch {} }}
              className="h-9 rounded-md border px-3 text-xs"
            >
              Stop
            </button>
          )}
        </div>
      </div>

      {/* Preset prompts - extension from bottom of composer (only in new chat mode) */}
      {!hasHistory && showPresets && presets.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-10 bg-surface rounded-b-2xl border-x-2 border-b-2 border-border shadow-lg">
          <div className="border-t-2 border-border pt-3 pb-3">
            <div className="px-3 space-y-0.5">
              {presets.map((preset, index) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-md",
                    "text-sm text-foreground",
                    "hover:bg-muted transition-all duration-150",
                    "active:bg-muted/90 active:scale-[0.98]",
                    "flex items-start gap-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    index < presets.length - 1 && "border-b border-border/50"
                  )}
                >
                  {preset.icon && (
                    <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden>
                      {preset.icon}
                    </span>
                  )}
                  {/* Show prompt text instead of label to match test expectations */}
                  <span className="flex-1 font-medium leading-relaxed">{preset.prompt}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// NOTE: Default export for dynamic imports and tests
export default ChatComposer;


