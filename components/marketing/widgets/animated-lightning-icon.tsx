'use client';
import { Zap } from "lucide-react";
import * as React from "react";

export function AnimatedLightningIcon() {
  const [start, setStart] = React.useState(false);
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      if (reduce) return;
    }
    const id = setTimeout(() => setStart(true), 400);
    const off = setTimeout(() => setStart(false), 1400);
    return () => { clearTimeout(id); clearTimeout(off); };
  }, []);
  return (
    <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg bg-muted text-foreground">
      <Zap className={`h-5 w-5 transition-transform ${start ? "scale-110" : "scale-100"}`} />
      {start && (
        <span className="absolute inline-flex h-full w-full animate-ping motion-reduce:animate-none motion-reduce:transition-none rounded-full bg-primary/20" />
      )}
    </span>
  );
}
