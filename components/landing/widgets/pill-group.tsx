"use client";

import { cn } from "@/styles";
import { ArrowLeft, ArrowRight } from "lucide-react";
import React, { useEffect, useRef, useState } from "react";

interface PillGroupProps {
  items: string[];
  selected?: string;
  onSelect: (item: string) => void;
  id?: string;
  className?: string;
  renderItemLabel?: (item: string) => React.ReactNode;
}

export const PillGroup: React.FC<PillGroupProps> = ({
  items,
  selected,
  onSelect,
  id,
  className,
  renderItemLabel,
}) => {
  const ref = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  useEffect(() => {
    const calc = () => {
      if (!ref.current) return;
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      setCanLeft(scrollLeft > 0);
      setCanRight(scrollLeft + clientWidth < scrollWidth - 5);
    };
    calc();
    const el = ref.current;
    el?.addEventListener("scroll", calc);
    window.addEventListener("resize", calc);
    return () => {
      el?.removeEventListener("scroll", calc);
      window.removeEventListener("resize", calc);
    };
  }, [items]);

  const scrollBy = (dir: "left" | "right") => {
    if (!ref.current) return;
    const delta = dir === "left" ? -150 : 150;
    ref.current.scrollTo({ left: ref.current.scrollLeft + delta, behavior: "smooth" });
  };

  const focusItem = (index: number) => {
    const container = ref.current;
    if (!container) return;
    const buttons = container.querySelectorAll<HTMLButtonElement>("button[role='tab'], button");
    const target = buttons[index];
    if (target) {
      target.focus();
    }
  };

  // Selected change handling no longer requires mount guard

  return (
    <div
      className={cn("relative border border-border bg-background rounded-xl h-12 flex items-center overflow-hidden", className)}
      role="radiogroup"
      aria-label={id ? `${id} options` : "Filter options"}
    >
      <button
        className={cn(
          "absolute left-1 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors",
          canLeft ? "text-muted-foreground hover:bg-surface" : "text-muted-foreground/60 cursor-default",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        onClick={() => scrollBy("left")}
        disabled={!canLeft}
        aria-label={`Scroll ${id ?? "options"} left`}
      >
        <ArrowLeft size={16} />
      </button>

      <div id={id} ref={ref} className="flex gap-2 overflow-x-auto scrollbar-none px-8 py-2" aria-live="off">
        {items.map((item) => (
          <button
            key={item}
            type="button"
            className={cn(
              "px-5 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all border",
              selected === item
                ? "bg-primary text-primary-foreground border-primary shadow-md"
                : "bg-background text-foreground border-border hover:bg-surface-hover hover:border-border",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            )}
            role="radio"
            aria-checked={selected === item}
            tabIndex={selected === item ? 0 : -1}
            onKeyDown={(e) => {
              const itemsCount = items.length;
              const currentIndex = selected ? items.indexOf(selected) : 0;
              if (e.key === "ArrowRight") {
                const next = (currentIndex + 1) % itemsCount;
                const nextItem = items[next];
                if (nextItem !== undefined) {
                  onSelect(nextItem);
                  focusItem(next);
                  e.preventDefault();
                }
              } else if (e.key === "ArrowLeft") {
                const prev = (currentIndex - 1 + itemsCount) % itemsCount;
                const prevItem = items[prev];
                if (prevItem !== undefined) {
                  onSelect(prevItem);
                  focusItem(prev);
                  e.preventDefault();
                }
              } else if (e.key === "Home") {
                const firstItem = items[0];
                if (firstItem !== undefined) {
                  onSelect(firstItem);
                  focusItem(0);
                  e.preventDefault();
                }
              } else if (e.key === "End") {
                const lastItem = items[itemsCount - 1];
                if (lastItem !== undefined) {
                  onSelect(lastItem);
                  focusItem(itemsCount - 1);
                  e.preventDefault();
                }
              }
            }}
            onClick={() => onSelect(item)}
          >
            {renderItemLabel ? renderItemLabel(item) : item}
          </button>
        ))}
      </div>

      <button
        className={cn(
          "absolute right-1 top-1/2 -translate-y-1/2 rounded-full p-2 transition-colors",
          canRight ? "text-muted-foreground hover:bg-surface" : "text-muted-foreground/60 cursor-default",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        )}
        onClick={() => scrollBy("right")}
        disabled={!canRight}
        aria-label={`Scroll ${id ?? "options"} right`}
      >
        <ArrowRight size={16} />
      </button>
    </div>
  );
};


