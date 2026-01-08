"use client";

import { cn } from "@/styles";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { ChevronDown } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import * as React from "react";

export type ChatModelTier = 'auto' | 'fast' | 'thinking' | 'pro';

const MODEL_TIERS: Array<{ id: ChatModelTier; label: string }> = [
  { id: 'auto', label: 'Auto' },
  { id: 'fast', label: 'Fast' },
  { id: 'thinking', label: 'Thinking' },
  { id: 'pro', label: 'Pro' },
];

// Model labels without "Corso" prefix (for the darker colored part)
const MODEL_SUFFIX_LABELS: Record<ChatModelTier, string> = {
  auto: 'Chat',
  fast: 'Fast',
  thinking: 'Thinking',
  pro: 'Pro',
};

// Labels for dropdown menu items (without "Corso" prefix)
const DROPDOWN_ITEM_LABELS: Record<ChatModelTier, string> = {
  auto: 'Auto',
  fast: 'Fast',
  thinking: 'Thinking',
  pro: 'Pro',
};

/**
 * ChatModelDropdown – Dropdown to select AI model tier for chat.
 * Persists selection in URL query param `?model=...` and preserves other params.
 */
export function ChatModelDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Read model from URL, default to 'auto' if missing/invalid
  const currentModel = React.useMemo(() => {
    const param = searchParams?.get('model');
    if (param && MODEL_TIERS.some(tier => tier.id === param)) {
      return param as ChatModelTier;
    }
    return 'auto';
  }, [searchParams]);

  const handleSelect = React.useCallback((value: string) => {
    const newModel = value as ChatModelTier;
    const params = new URLSearchParams(searchParams?.toString() ?? '');
    params.set('model', newModel);
    router.replace(`${pathname}?${params.toString()}`);
  }, [router, pathname, searchParams]);

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className={cn(
            "flex items-center gap-2 text-xl font-normal group",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "cursor-pointer subpixel-antialiased"
          )}
        >
          <span className="font-normal truncate">
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">Corso </span>
            <span className="group-hover:text-foreground transition-colors">{MODEL_SUFFIX_LABELS[currentModel]}</span>
          </span>
          <ChevronDown className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors flex-shrink-0" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          sideOffset={2}
          align="start"
          className={cn(
            "z-[2000] min-w-[180px] border border-border shadow-lg p-1 rounded-md bg-background overflow-hidden"
          )}
        >
          <DropdownMenu.RadioGroup value={currentModel} onValueChange={handleSelect}>
            {MODEL_TIERS.map((tier) => (
              <DropdownMenu.RadioItem
                key={tier.id}
                value={tier.id}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-2 text-sm cursor-pointer",
                  "hover:bg-black/5 focus:bg-black/5",
                  "data-[state=checked]:bg-black/10"
                )}
              >
                <span>{DROPDOWN_ITEM_LABELS[tier.id]}</span>
              </DropdownMenu.RadioItem>
            ))}
          </DropdownMenu.RadioGroup>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
