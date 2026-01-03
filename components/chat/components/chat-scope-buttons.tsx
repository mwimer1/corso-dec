// components/chat/components/chat-scope-buttons.tsx
// Circular scope button selector for chat interface

"use client";

import { cn } from "@/styles";
import * as React from "react";

export type ChatScope = 'recommended' | 'projects' | 'companies' | 'addresses';

interface ChatScopeButtonsProps {
  selectedScope: ChatScope;
  onScopeChange: (scope: ChatScope) => void;
  className?: string;
}

const SCOPE_OPTIONS: Array<{ id: ChatScope; label: string }> = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'projects', label: 'Project' },
  { id: 'companies', label: 'Companies' },
  { id: 'addresses', label: 'Addresses' },
];

/**
 * ChatScopeButtons - Circular button selector for chat scope
 */
export function ChatScopeButtons({
  selectedScope,
  onScopeChange,
  className,
}: ChatScopeButtonsProps) {
  return (
    <div className={cn("flex items-center justify-center gap-3 relative z-0", className)}>
      {SCOPE_OPTIONS.map((option) => {
        const isSelected = selectedScope === option.id;
        return (
          <button
            key={option.id}
            type="button"
            onClick={() => onScopeChange(option.id)}
            className={cn(
              "h-10 px-4 rounded-full text-sm font-medium transition-all",
              "border-2",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-surface text-foreground border-border hover:bg-surface-hover hover:border-border-hover",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
            aria-pressed={isSelected}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
