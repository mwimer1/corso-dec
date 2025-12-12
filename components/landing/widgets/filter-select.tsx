"use client";

// components/landing/widgets/filter-select.tsx
import { Select } from "@/components/ui/molecules/select";
import { cn } from "@/styles";
import * as React from "react";

type Props = {
  title: string;
  items: string[];
  selected?: string;
  onSelect: (item: string) => void;
  id?: string;
  className?: string;
};

/** A compact, a11y-friendly dropdown replacement for FilterPills. */
export function FilterSelect({
  title,
  items,
  selected = items[0],
  onSelect,
  id,
  className,
}: Props) {
  const norm = (v: string) =>
    title.toLowerCase().includes("property") && v === "All" ? "All Types" : v;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-foreground">{title}</h3>
        {selected && (
          <span className="rounded border border-border bg-surface px-2 py-1 text-xs text-muted-foreground">
            {norm(selected)}
          </span>
        )}
      </div>
      <Select
        {...(id && { id })}
        aria-label={title}
        value={selected}
        onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onSelect(e.target.value)}
        className="w-full"
      >
        {items.map((it) => (
          <option key={it} value={it}>
            {norm(it)}
          </option>
        ))}
      </Select>
    </div>
  );
}


