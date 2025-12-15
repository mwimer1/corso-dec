"use client";

import { ArrowUpIcon, SegmentedControl } from '@/components';
import * as React from 'react';

type ChatComposerProps = {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  disabled?: boolean;
  placeholder?: string;
  onFocus?: () => void;
  onInputAutoGrow?: (el: HTMLTextAreaElement | null) => void;
  isProcessing?: boolean;
  mode: 'projects' | 'companies' | 'addresses';
  setMode: (m: 'projects' | 'companies' | 'addresses') => void;
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
    mode = 'projects',
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
    <div className="mx-auto w-full max-w-3xl rounded-2xl bg-surface p-3 shadow-sm" role="region" aria-label="Message composer">
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
        className="min-h-[44px] max-h-40 w-full resize-none rounded-md bg-transparent px-3 py-2 text-sm outline-none focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
        disabled={disabled}
      />

      <div className="mt-2 flex items-center justify-between" role="toolbar" aria-label="Composer actions">
        <div>
          <SegmentedControl
            value={mode}
            onChange={(v) => setMode(v)}
            options={[
              { id: 'projects', label: 'Projects' },
              { id: 'companies', label: 'Companies' },
              { id: 'addresses', label: 'Addresses' },
            ]}
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="More actions"
            className="h-9 w-9 rounded-md border border-border bg-surface inline-flex items-center justify-center hover:bg-surface-hover"
            onClick={() => inputRef.current?.focus()}
            disabled={isProcessing}
            title="More"
          >
            <span aria-hidden className="text-[18px] leading-none">+</span>
          </button>
          <button
            type="button"
            aria-label="Send"
            onClick={() => onSend()}
            disabled={!canSend}
            className="h-9 w-9 rounded-md bg-primary text-primary-foreground inline-flex items-center justify-center disabled:opacity-50 hover:shadow-sm active:opacity-90"
            aria-describedby="chat-send-hint"
          >
            <ArrowUpIcon pixelSize={18} />
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


