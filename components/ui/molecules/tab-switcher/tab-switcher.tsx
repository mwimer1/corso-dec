// components/ui/molecules/tab-switcher/tab-switcher.tsx
"use client";

import {
    tabSwitcherVariants,
    type TabSwitcherVariantProps,
} from "@/styles/ui/molecules";
import { tabButtonVariants } from "@/styles/ui/molecules/tab-switcher";
import { cn } from "@/styles/utils";
import * as React from "react";
import { useArrowKeyNavigation } from "../shared/use-arrow-key-navigation";
import { getTabButtonClass } from "./tab-button-base";

const UNDERLINE_CLASS_BY_COLOR = {
  foreground: 'after:bg-foreground', // default—matches grid’s border-foreground
  primary:    'after:bg-primary',
  muted:      'after:bg-muted',
} as const;

/** Tab metadata for object-based API. */
export interface TabItem {
  id: string;
  label: string;
}

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

type TabSwitcherBaseProps = React.HTMLAttributes<HTMLDivElement> &
  TabSwitcherVariantProps & {
    /** Index of the active tab (controlled mode). */
    active?: number;
    /** Callback fired when the tab selection changes. */
    onTabChange?: (_index: number) => void; // v2025-06-10-audit
    /** Visual preset for the individual tab triggers (tab buttons). */
    buttonVariant?: "default" | "showcaseWhite" | "grid";
    /** Layout of the tab triggers. */
    layout?: "row" | "grid";
    /** Show vertical separators between grid buttons (default: true). */
    gridSeparators?: boolean;
    /** Color of the active underline for row layout (bottom border that spans only the active tab). */
    activeUnderlineColor?: "foreground" | "primary";
  };

type TabSwitcherPropsItems = TabSwitcherBaseProps & {
  tabs: TabItem[];
};

type TabSwitcherPropsArray = TabSwitcherBaseProps & {
  tabs: string[];
};

type Props = TabSwitcherPropsArray | TabSwitcherPropsItems;

/* -------------------------------------------------------------------------- */
/*                                 Component                                  */
/* -------------------------------------------------------------------------- */

/**
 * normalizeTabs
 * Coerces string[] or TabItem[] into a uniform array of { id, label }.
 * For string tabs, IDs follow the existing pattern `tab-${index}`.
 */
function normalizeTabs(tabs: string[] | TabItem[]): { id: string; label: string }[] {
  return (tabs as Array<string | TabItem>).map((t, idx) =>
    typeof t === "string" ? { id: `tab-${idx}`, label: t } : t
  );
}

/**
 * Accessible tab list component supporting either a simple `string[]`
 * or an array of `TabItem` objects for richer semantics.
 */
const TabSwitcherOverloads = React.forwardRef<HTMLDivElement, Props>(function TabSwitcher(
  props,
  ref,
) {
  const {
    tabs,
    active,
    onTabChange,
    variant = "default",
    size = "lg",
    alignment = "center",
    buttonVariant = "default",
    layout = "row",
    gridSeparators = true,
    activeUnderlineColor = "foreground",
    className,
    ...rest
  } = props as Props;
  /* ------------------------------- State ------------------------------ */
  const [internalActive, setInternalActive] = React.useState(0);
  const currentIndex = active ?? internalActive;

  /* ------------------------------ Hooks ----------------------------- */
  const { getRef, onKeyDown } = useArrowKeyNavigation<HTMLButtonElement>({
    itemCount: tabs.length,
    onSelect: (idx) => handleSelectTab(idx),
  });

  /* ------------------------------ Helpers ----------------------------- */
  const isObjectTabs = React.useMemo(() => typeof tabs[0] === "object", [tabs]);
  const normalizedTabs = React.useMemo(() => normalizeTabs(tabs as any), [tabs]);

  const handleSelectTab = (index: number) => {
    if (active === undefined) setInternalActive(index);
    onTabChange?.(index);
  };

  /* ------------------------------ Render ------------------------------ */
  return (
    <div
      ref={ref}
      className={cn(
        tabSwitcherVariants({ variant, size, alignment }),
        className,
      )}
      {...rest}
    >
      {layout === 'grid' ? (
        <div aria-hidden="true" className="relative left-1/2 -translate-x-1/2 w-screen border-t border-border" />
      ) : null}
      <div
        role="tablist"
        className={cn(
          layout === 'grid'
            ? cn('grid w-full grid-cols-2 lg:grid-cols-4', gridSeparators ? 'divide-x divide-border' : 'divide-x-0')
            : 'flex w-full justify-center gap-xs sm:gap-sm',
          // Hide baseline divider for minimal showcase pills and for grid layout
          !(variant === 'minimal' && buttonVariant === 'showcaseWhite') && layout !== 'grid' && 'border-b border-border',
        )}
      >
        {normalizedTabs.map((item, idx) => {
          const isActive = currentIndex === idx;
          const activeUnderlineColorSafe = activeUnderlineColor ?? 'foreground';
          const underlineClass = UNDERLINE_CLASS_BY_COLOR[activeUnderlineColorSafe];
          return (
            <button
              type="button"
              key={isObjectTabs ? item.id : idx}
              ref={getRef(idx)}
              role="tab"
              tabIndex={isActive ? 0 : -1}
              className={cn(
                tabButtonVariants({ isActive, preset: layout === 'grid' ? 'grid' : buttonVariant }),
                getTabButtonClass(isActive),
                // Active underline that aligns to the baseline divider; only for row layout
                layout !== 'grid' && isActive &&
                  cn(
                    'relative after:content-[""] after:absolute after:left-0 after:bottom-0 after:h-[2px] after:w-full after:z-[1]',
                    underlineClass,
                  )
              )}
              onClick={() => handleSelectTab(idx)}
              onKeyDown={(e) => onKeyDown(e, idx)}
              aria-selected={isActive}
              data-state={isActive ? 'active' : 'inactive'}
              aria-controls={`panel-${item.id}`}
              id={`tab-${item.id}`}
              data-underline={variant === "minimal" && layout !== 'grid' ? "true" : undefined}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
});

TabSwitcherOverloads.displayName = "TabSwitcher";

// Export with overloads for backward compatibility
export function TabSwitcher(props: TabSwitcherPropsArray): JSX.Element;
export function TabSwitcher(props: TabSwitcherPropsItems): JSX.Element;
export function TabSwitcher(props: Props): JSX.Element {
  return <TabSwitcherOverloads {...props} />;
}


