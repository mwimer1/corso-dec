"use client";

// Filter pills delegating to PillGroup
import React from "react";
import { PillGroup } from "./pill-group";

type Props = {
  title: string;
  items: string[];
  selected?: string;
  onSelect: (item: string) => void;
  id?: string;
};

export const FilterPills: React.FC<Props> = ({ title, items, selected = items[0], onSelect, id }) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-base text-foreground">{title}</h3>
        {selected && (
          <span className="text-xs text-muted-foreground bg-surface px-2 py-1 rounded border">
            {title.includes("Property") && selected === "All" ? "All Types" : selected}
          </span>
        )}
      </div>
      <PillGroup
        {...(id && { id })}
        items={items}
        {...(selected && { selected })}
        onSelect={onSelect}
        renderItemLabel={(item) => (title.includes("Property") && item === "All" ? "All Types" : item)}
        className="shadow-sm"
      />
    </div>
  );
};


