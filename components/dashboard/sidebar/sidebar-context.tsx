'use client';

import { createContext, useContext, useMemo, type ReactNode } from 'react';

export type SidebarState = { collapsed: boolean };

const SidebarCtx = createContext<SidebarState | null>(null);

export function SidebarProvider({ collapsed, children }: { collapsed: boolean; children: ReactNode }) {
  const value = useMemo(() => ({ collapsed }), [collapsed]);
  return <SidebarCtx.Provider value={value}>{children}</SidebarCtx.Provider>;
}

export function useSidebar(): SidebarState {
  const ctx = useContext(SidebarCtx);
  if (!ctx) throw new Error('useSidebar must be used within <SidebarProvider>');
  return ctx;
}
