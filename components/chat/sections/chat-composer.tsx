"use client";

import { ArrowUpIcon, Badge } from '@/components';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import { Check } from 'lucide-react';
import * as React from 'react';
import { CHAT_MODE_LABEL, CHAT_MODE_OPTIONS, type ChatMode } from '../lib/chat-mode';

type ChatComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onInputAutoGrow?: (el: HTMLTextAreaElement | null) => void;
  isProcessing?: boolean;
  mode: ChatMode;
  setMode: (m: ChatMode) => void;
  stop?: () => void;
  canSend?: boolean;
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
    mode = 'auto',
    setMode = () => {},
    stop,
    canSend = false,
  } = props || {};
  
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);
  const [isComposing, setIsComposing] = React.useState(false);

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

  return (
    <div className="mx-auto w-full max-w-3xl lg:max-w-4xl 2xl:max-w-5xl rounded-2xl bg-surface p-3 shadow-sm focus-within:ring-1 focus-within:ring-border focus-within:ring-offset-2 focus-within:ring-offset-background transition-shadow" role="region" aria-label="Message composer">
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
                aria-label={mode === 'auto' ? 'Change data scope (currently: Auto - AI determines table)' : `Change data scope (currently: ${CHAT_MODE_LABEL[mode]})`}
                className="h-9 w-9 rounded-md border border-border bg-surface inline-flex items-center justify-center hover:bg-surface-hover disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isProcessing}
                title={mode === 'auto' ? 'Change data scope (currently: Auto - AI determines table)' : `Change data scope (currently: ${CHAT_MODE_LABEL[mode]})`}
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
                  Data scope
                </DropdownMenu.Label>
                <DropdownMenu.Separator className="my-1 h-px bg-border" />
                <DropdownMenu.RadioGroup value={mode} onValueChange={(v) => setMode(v as ChatMode)}>
                  {CHAT_MODE_OPTIONS.map((option) => (
                    <DropdownMenu.RadioItem
                      key={option.id}
                      value={option.id}
                      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm cursor-pointer hover:bg-black/5 focus:bg-black/5 focus:outline-none"
                    >
                      <DropdownMenu.ItemIndicator className="inline-flex items-center justify-center">
                        <Check className="h-4 w-4" />
                      </DropdownMenu.ItemIndicator>
                      {option.label}
                    </DropdownMenu.RadioItem>
                  ))}
                </DropdownMenu.RadioGroup>
              </DropdownMenu.Content>
            </DropdownMenu.Portal>
          </DropdownMenu.Root>
          {mode !== 'auto' && (
            <Badge color="secondary" aria-hidden="true">
              {CHAT_MODE_LABEL[mode]}
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Send"
            onClick={() => onSend()}
            disabled={!canSend}
            className="h-9 w-9 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center disabled:opacity-50 hover:shadow-sm active:opacity-90"
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
    </div>
  );
}

// NOTE: Default export for dynamic imports and tests
export default ChatComposer;


