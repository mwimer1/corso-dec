// components/ui/molecules/shared/use-arrow-key-navigation.ts
"use client";

import { useCallback, useRef } from "react";

/**
 * Shared hook for arrow key navigation in tab-like components
 * Handles Left/Right/Home/End navigation with proper focus management
 */
export function useArrowKeyNavigation<T extends HTMLElement>(params: {
  itemCount: number;
  onSelect: (_newIdx: number) => void;
}) {
  const { itemCount, onSelect } = params;
  const itemRefs = useRef<(T | null)[]>([]);

  const getRef = useCallback((index: number) => (el: T | null) => {
    itemRefs.current[index] = el;
  }, []);

  const onKeyDown = useCallback((event: React.KeyboardEvent, currentIndex: number) => {
    let newIndex: number;

    switch (event.key) {
      case "ArrowRight":
        newIndex = (currentIndex + 1) % itemCount;
        break;
      case "ArrowLeft":
        newIndex = (currentIndex - 1 + itemCount) % itemCount;
        break;
      case "Home":
        newIndex = 0;
        break;
      case "End":
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
  }, [itemCount, onSelect]);

  return { getRef, onKeyDown };
}

