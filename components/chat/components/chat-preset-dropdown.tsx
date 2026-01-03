// components/chat/components/chat-preset-dropdown.tsx
// Preset dropdown that shows category-specific prompts

"use client";

import { cn } from "@/styles";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import * as React from "react";
import { getPresetsForScope, type ChatPreset, type ChatScope } from "../lib/chat-presets";

interface ChatPresetDropdownProps {
  scope: ChatScope;
  onPresetSelect: (prompt: string) => void;
  className?: string;
}

/**
 * ChatPresetDropdown - Shows category-specific preset prompts
 */
export function ChatPresetDropdown({
  scope,
  onPresetSelect,
  className,
}: ChatPresetDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const presets = React.useMemo(() => getPresetsForScope(scope), [scope]);

  const handlePresetClick = React.useCallback((preset: ChatPreset) => {
    onPresetSelect(preset.prompt);
    setOpen(false);
  }, [onPresetSelect]);

  return (
    <DropdownMenu.Root open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-md",
            "border border-border bg-surface hover:bg-surface-hover",
            "text-sm font-medium text-foreground",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            className
          )}
        >
          <span>Presets</span>
          <ChevronDown className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          side="top"
          sideOffset={8}
          align="start"
          className={cn(
            "z-[2000] min-w-[280px] max-w-md border border-border shadow-lg rounded-md bg-background p-2",
            "max-h-[400px] overflow-y-auto"
          )}
        >
          <DropdownMenu.Label className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
            {scope === 'recommended' ? 'Recommended Prompts' : `${scope.charAt(0).toUpperCase() + scope.slice(1)} Prompts`}
          </DropdownMenu.Label>
          <DropdownMenu.Separator className="my-1 h-px bg-border" />
          <div className="space-y-1">
            {presets.map((preset) => (
              <DropdownMenu.Item
                key={preset.id}
                onSelect={() => handlePresetClick(preset)}
                className={cn(
                  "flex items-start gap-3 rounded-sm px-3 py-2.5 text-sm cursor-pointer",
                  "hover:bg-black/5 focus:bg-black/5 focus:outline-none",
                  "transition-colors"
                )}
              >
                {preset.icon && (
                  <span className="text-base leading-none mt-0.5" aria-hidden>
                    {preset.icon}
                  </span>
                )}
                <span className="flex-1 font-medium text-foreground">{preset.label}</span>
              </DropdownMenu.Item>
            ))}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
