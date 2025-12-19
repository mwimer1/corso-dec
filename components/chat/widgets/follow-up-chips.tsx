"use client";

interface FollowUpChipsProps {
  items: string[];
  onClick: (item: string) => void;
}

export function FollowUpChips({ items, onClick }: FollowUpChipsProps) {
  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          onClick={() => onClick(item)}
          className="px-3 py-1 text-sm rounded-full bg-primary/10 text-primary/90 hover:bg-primary/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
