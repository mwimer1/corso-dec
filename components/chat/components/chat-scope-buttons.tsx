// components/chat/components/chat-scope-buttons.tsx
// Circular scope button selector for chat interface

"use client";

import { cn } from "@/styles";
import * as React from "react";

export type ChatScope = 'default' | 'projects' | 'companies' | 'addresses';

interface ChatScopeButtonsProps {
  activeScope: ChatScope | null; // Transient - null means no button is active
  onScopeChange: (scope: ChatScope) => void;
  className?: string;
}

const SCOPE_OPTIONS: Array<{ id: ChatScope; label: string }> = [
  { id: 'projects', label: 'Projects' },
  { id: 'companies', label: 'Companies' },
  { id: 'addresses', label: 'Addresses' },
];

/**
 * ChatScopeButtons - Transient button triggers for chat scope presets
 * Buttons do not persist selected state - they trigger preset dropdowns temporarily
 */
export function ChatScopeButtons({
  activeScope,
  onScopeChange,
  className,
}: ChatScopeButtonsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3 flex-wrap relative z-0", className)}>
      {SCOPE_OPTIONS.map((option) => {
        const isActive = activeScope === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onScopeChange(option.id)}
            className={cn(
              "h-10 px-4 rounded-full text-sm font-medium transition-all",
              "border-2",
              isActive
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-surface text-foreground border-border hover:bg-surface-hover hover:border-border-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-pressed={isActive}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
