// components/ui/hooks/use-arrow-key-navigation.ts
'use client';

import { useCallback, useRef } from 'react';

/**
 * Hook for arrow key navigation in tab-like components.
 * Handles Left/Right/Home/End navigation with proper focus management.
 *
 * @template T - The type of the HTML element being navigated (e.g., HTMLButtonElement).
 * @param params - Configuration object
 * @param params.itemCount - The total number of items in the navigation list.
 * @param params.onSelect - Callback fired with the new index when navigation occurs.
 * @returns An object containing a `getRef` function to attach to each item
 * and an `onKeyDown` handler for keyboard events.
 *
 * @example
 * ```tsx
 * import { useArrowKeyNavigation } from '@/components/ui/hooks/use-arrow-key-navigation';
 *
 * function TabNavigation() {
 *   const tabs = ['Home', 'Profile', 'Settings', 'Help'];
 *   const [activeTab, setActiveTab] = React.useState(0);
 *
 *   const { getRef, onKeyDown } = useArrowKeyNavigation<HTMLButtonElement>({
 *     itemCount: tabs.length,
 *     onSelect: (newIdx) => setActiveTab(newIdx)
 *   });
 *
 *   return (
 *     <div role="tablist">
 *       {tabs.map((tab, index) => (
 *         <button
 *           key={tab}
 *           ref={getRef(index)}
 *           role="tab"
 *           aria-selected={index === activeTab}
 *           onKeyDown={(e) => onKeyDown(e, index)}
 *           onClick={() => setActiveTab(index)}
 *         >
 *           {tab}
 *         </button>
 *       ))}
 *     </div>
 *   );
 * }
 * ```
 */
export function useArrowKeyNavigation<T extends HTMLElement>(params: {
  itemCount: number;
  onSelect: (_newIdx: number) => void;
}) {
  const { itemCount, onSelect } = params;
  const itemRefs = useRef<(T | null)[]>([]);

  const getRef = useCallback(
    (index: number) => (el: T | null) => {
      itemRefs.current[index] = el;
    },
    []
  );

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent, currentIndex: number) => {
      let newIndex: number;

      switch (event.key) {
        case 'ArrowRight':
          newIndex = (currentIndex + 1) % itemCount;
          break;
        case 'ArrowLeft':
          newIndex = (currentIndex - 1 + itemCount) % itemCount;
          break;
        case 'Home':
          newIndex = 0;
          break;
        case 'End':
          newIndex = itemCount - 1;
          break;
        default:
          return;
      }

      event.preventDefault();

      const targetItem = itemRefs.current[newIndex];
      if (targetItem) {
        targetItem.focus();
        onSelect(newIndex);
      }
    },
    [itemCount, onSelect]
  );

  return { getRef, onKeyDown };
}
