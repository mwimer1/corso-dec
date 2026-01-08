"use client";

import { cn } from '@/styles';
import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';
import { useSidebar } from './sidebar-context';

const Ctx = createContext<HTMLElement | null>(null);

export function SidebarTooltipProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [layerEl, setLayerEl] = useState<HTMLElement | null>(null);
  const { collapsed } = useSidebar();

  useLayoutEffect(() => {
    if (ref.current) setLayerEl(ref.current);
  }, []);

  return (
    <Ctx.Provider value={layerEl}>
      {children}
      <div
        ref={ref}
        className={cn(
          "absolute inset-0 overflow-visible pointer-events-none",
          "z-[var(--sb-tip-z,60)]",
          // Show only when collapsed
          collapsed ? "block" : "hidden"
        )}
        aria-hidden="true"
      />
    </Ctx.Provider>
  );
}

export function useSidebarTooltipLayer() {
  return useContext(Ctx);
}


