"use client";

import { createContext, useContext, useLayoutEffect, useRef, useState } from 'react';

const Ctx = createContext<HTMLElement | null>(null);

export function SidebarTooltipProvider({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [layerEl, setLayerEl] = useState<HTMLElement | null>(null);

  useLayoutEffect(() => {
    if (ref.current) setLayerEl(ref.current);
  }, []);

  return (
    <Ctx.Provider value={layerEl}>
      {children}
      <div
        ref={ref}
        className="sb-tooltip-layer"
        aria-hidden="true"
      />
    </Ctx.Provider>
  );
}

export function useSidebarTooltipLayer() {
  return useContext(Ctx);
}


