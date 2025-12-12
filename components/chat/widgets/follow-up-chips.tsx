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
          className="px-3 py-1 text-sm bg-blue-100 text-blue-800 rounded-full hover:bg-blue-200 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          {item}
        </button>
      ))}
    </div>
  );
}
