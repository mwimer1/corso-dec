"use client";

import { cn } from "@/styles";
import * as React from "react";

type SegmentedOption<T extends string> = { id: T; label: string };

type Props<T extends string> = {
  value: T;
  onChange: (v: T) => void;
  options: SegmentedOption<T>[];
  className?: string;
};

export function SegmentedControl<T extends string>({ value, onChange, options, className }: Props<T>) {
  const refs = React.useRef<Array<HTMLButtonElement | null>>([]);
  React.useEffect(() => {
    refs.current = refs.current.slice(0, options.length);
  }, [options.length]);

  function focusIndex(i: number) {
    const el = refs.current[i];
    el?.focus();
  }

  function onKeyDown(e: React.KeyboardEvent, i: number) {
    if (e.key === "ArrowRight") { e.preventDefault(); focusIndex((i + 1) % options.length); }
    if (e.key === "ArrowLeft") { e.preventDefault(); focusIndex((i - 1 + options.length) % options.length); }
    if (e.key === "Home") { e.preventDefault(); focusIndex(0); }
    if (e.key === "End") { e.preventDefault(); focusIndex(options.length - 1); }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const opt = options[i];
      if (!opt) return;
      onChange(opt.id);
    }
  }

  return (
    <div role="tablist" aria-orientation="horizontal" className={cn("flex gap-1", className)}>
      {options.map((opt, i) => {
        const selected = opt.id === value;
        return (
          <button
            key={opt.id}
            ref={(el) => { refs.current[i] = el; }}
            role="tab"
            aria-selected={selected}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(opt.id)}
            onKeyDown={(e) => onKeyDown(e, i)}
            className={
              "h-8 px-3 text-xs rounded-md border " +
              (selected ? "bg-surface-selected text-foreground border-border" : "bg-surface text-muted-foreground border-border hover:bg-surface-hover")
            }
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}



