"use client";

import { ArrowUpIcon } from '@/components/ui/atoms/icon/icons';
import { Badge } from '@/components/ui/atoms/badge';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import * as React from 'react';
import type { ChatMode } from '../lib/chat-mode';
import { getPresetsForScope, type ChatScope, type ChatPreset } from '../lib/chat-presets';
import { cn } from '@/styles';

type ChatComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void; // Called when input is focused (for default presets)
  onInputAutoGrow?: (el: HTMLTextAreaElement | null) => void;
  isProcessing?: boolean;
  mode?: ChatMode; // Optional now since we're not using it for the dropdown
  setMode?: (m: ChatMode) => void; // Optional now
  stop?: () => void;
  canSend?: boolean;
  deepResearch?: boolean;
  setDeepResearch?: (enabled: boolean) => void;
  scope?: ChatScope; // Scope for showing presets (null means no active scope)
  showPresets?: boolean; // Whether to show preset dropdown
  onPresetVisibilityChange?: (visible: boolean) => void; // Callback to control preset visibility
  onPresetSelect?: (prompt: string) => void; // Callback when preset is clicked
  onResetScope?: () => void; // Called when clicking outside to reset scope
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
    onFocus,
    onInputAutoGrow,
    isProcessing = false,
    mode: _mode = 'auto',
    setMode: _setMode = () => {},
    stop,
    canSend = false,
    deepResearch: _deepResearch = false,
    setDeepResearch: _setDeepResearch = () => {},
    scope,
    showPresets = false,
    onPresetVisibilityChange,
    onPresetSelect,
    onResetScope,
    hasHistory = false,
  } = props || {};
  
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const composerRef = React.useRef<HTMLDivElement | null>(null);
  const [isComposing, setIsComposing] = React.useState(false);

  // Get presets for current scope (default to 'default' if scope is null)
  const presets = React.useMemo(() => {
    const effectiveScope = scope ?? 'default';
    return getPresetsForScope(effectiveScope);
  }, [scope]);

  // Presets are visible in new chat mode (no history) when:
  // - showPresets is true (set by scope button click)
  // - presets are available for current scope
  // - input is empty
  // Hide presets when user starts typing to reduce visual clutter
  const shouldShowPresets = showPresets && !hasHistory && presets.length > 0 && value.trim().length === 0;

  // Auto-hide presets when user starts typing
  React.useEffect(() => {
    if (value.trim().length > 0 && showPresets) {
      onPresetVisibilityChange?.(false);
    }
  }, [value, showPresets, onPresetVisibilityChange]);

  // Handle input focus - trigger default presets in new chat mode
  const handleFocus = React.useCallback(() => {
    onFocus?.();
  }, [onFocus]);

  // Close presets dropdown and reset scope when clicking outside the composer area
  React.useEffect(() => {
    if (!shouldShowPresets) return;
    
    const handleClickOutside = (event: MouseEvent) => {
      if (composerRef.current && !composerRef.current.contains(event.target as Node)) {
        onPresetVisibilityChange?.(false);
        onResetScope?.(); // Reset scope when clicking outside
      }
    };
    
    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [shouldShowPresets, onPresetVisibilityChange, onResetScope]);

  // Note: Usage limits are now fetched in ChatWindow via useUsageLimits hook
  // and passed down as props if needed. This removes duplicate fetching.

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
    }
    // Hide presets after selection
    onPresetVisibilityChange?.(false);
  }, [onPresetSelect, onPresetVisibilityChange]);

  return (
    <div 
      ref={composerRef}
      className={cn(
        "relative mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl bg-surface p-3 shadow-sm border-2 border-border focus-within:ring-1 focus-within:ring-border focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow z-10",
        shouldShowPresets ? "rounded-t-2xl" : "rounded-2xl"
      )}
      role="region" 
      aria-label="Message composer"
    >
      <label htmlFor="chat-message-input" className="sr-only">
        Chat message input
      </label>
      <textarea
        id="chat-message-input"
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onCompositionStart={onCompositionStart}
        onCompositionEnd={onCompositionEnd}
        placeholder={placeholder}
        aria-label="Chat message input"
        rows={1}
        onInput={(e) => onInputAutoGrow?.(e.currentTarget)}
        className="min-h-[44px] max-h-40 w-full resize-none rounded-md bg-transparent px-3 py-2 text-base font-normal outline-none focus:outline-none focus-visible:outline-none subpixel-antialiased"
        disabled={disabled}
      />

      <div className="mt-2 flex items-center justify-between" role="toolbar" aria-label="Composer actions">
        <div className="flex items-center gap-2">
          <DropdownMenu.Root>
            <DropdownMenu.Trigger asChild>
              <button
                type="button"
                aria-label="Open chat tools menu"
                className="h-9 w-9 rounded-md border border-border bg-surface inline-flex items-center justify-center hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
                title="Chat tools"
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
                {/* Chat Tools Section */}
                <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                  Chat Tools
                </DropdownMenu.Label>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  disabled={true}
                  className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-not-allowed opacity-50"
                >
                  <span>Deep Research</span>
                  <Badge color="secondary" className="text-xs ml-2">
                    Coming Soon
                  </Badge>
                </DropdownMenu.Item>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.Item
                  disabled={true}
                  className="flex items-center justify-between rounded-sm px-2 py-1.5 text-sm cursor-not-allowed opacity-50"
                >
                  <span>Saved Prompts</span>
                  <Badge color="secondary" className="text-xs ml-2">
                    Coming Soon
                  </Badge>
                </DropdownMenu.Item>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
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
      {shouldShowPresets && (
        <div className="absolute left-0 right-0 top-[100%] z-[100] bg-surface rounded-b-2xl border-2 border-border shadow-lg">
          <div className="border-t-2 border-border pt-3 pb-3">
            <div className="px-3 space-y-0.5" role="group" aria-label="Suggested questions">
              {presets.map((preset, index) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset)}
                  className={cn(
                    "w-full text-left px-4 py-3 rounded-md",
                    "text-base font-normal text-foreground",
                    "hover:bg-muted transition-all duration-150",
                    "active:bg-muted/90 active:scale-[0.98]",
                    "flex items-start gap-3",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    "subpixel-antialiased",
                    index < presets.length - 1 && "border-b border-border/50"
                  )}
                >
                  {preset.icon && (
                    <span className="text-lg leading-none mt-0.5 flex-shrink-0" aria-hidden>
                      {preset.icon}
                    </span>
                  )}
                  {/* Show prompt text instead of label to match test expectations */}
                  <span className="flex-1 font-normal leading-relaxed">{preset.prompt}</span>
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


