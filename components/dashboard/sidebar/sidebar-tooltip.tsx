"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSidebarTooltipLayer } from './sidebar-tooltip-layer';
import { cn } from '@/styles';

type Props = {
  children: ReactNode;
  label: string;
  side?: 'right' | 'left';
  delayMs?: number;
  id?: string;
};

 export function SidebarTooltip({ children, label, side = 'right', delayMs = 80, id }: Props) {
   const layer = useSidebarTooltipLayer();
  const fallback = useId();
  const tipId = id ?? `sb-tip-${fallback}`;
  const [open, setOpen] = useState(false);
   const timer = useRef<number | null>(null);
   const triggerRef = useRef<HTMLSpanElement>(null);
   const [pos, setPos] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

  const show = () => {
    if (timer.current) window.clearTimeout(timer.current);
    // timer id is numeric in browsers; cast via unknown to satisfy TS
    timer.current = (window.setTimeout(() => {
      if (!triggerRef.current || !layer) return;
      const tRect = triggerRef.current.getBoundingClientRect();
      const lRect = layer.getBoundingClientRect();
      const gap = 8; // visual spacing; actual bubble styling still via tokens
      const left = side === 'right'
        ? tRect.right - lRect.left + gap
        : tRect.left - lRect.left - gap;
      const top = tRect.top - lRect.top + tRect.height / 2;
      setPos({ top, left });
      setOpen(true);
    }, delayMs) as unknown) as number;
  };
  const hide = () => {
    if (timer.current) window.clearTimeout(timer.current);
    setOpen(false);
  };

  useEffect(() => {
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, []);

   return (
    <span
      ref={triggerRef}
      className="relative inline-flex"
      onMouseEnter={show}
      onMouseLeave={hide}
      onFocusCapture={show}
      onBlurCapture={hide}
      data-side={side}
    >
      {/* child is expected to be a button or focusable element */}
      {children}
      {layer && open && createPortal(
        <span
          id={tipId}
          role="tooltip"
          className={cn(
            "absolute top-0 -translate-y-1/2",
            "whitespace-nowrap",
            "font-[var(--sb-tip-font)] text-[var(--sb-tip-size)] leading-[var(--sb-tip-line)]",
            "text-[var(--sb-tip-fg)] bg-[var(--sb-tip-bg)]",
            "rounded-[var(--sb-tip-radius)]",
            "py-[var(--sb-tip-pad-y)] px-[var(--sb-tip-pad-x)]",
            "shadow-[var(--sb-tip-shadow)]",
            "z-[var(--sb-tip-z,60)]",
            "pointer-events-none opacity-100",
            "origin-left-center",
            "transition-opacity transition-transform duration-[120ms] ease-in-out",
            side === 'left' && "left-auto right-[calc(100%+var(--sb-tip-gap))]",
            side === 'left' && "data-[open=true]:-translate-x-0.5"
          )}
          data-side={side}
          data-open={open ? 'true' : undefined}
          style={{
            top: pos.top,
            left: side === 'right' ? pos.left : undefined,
            right: side === 'left' ? `calc(100% - ${pos.left}px)` : undefined,
          }}
        >
          {label}
          <span 
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rotate-45",
              "w-2 h-2",
              "bg-[var(--sb-tip-bg)] shadow-[var(--sb-tip-shadow)]",
              side === 'left' ? "right-[-4px]" : "left-[-4px]"
            )} 
            aria-hidden="true" 
          />
        </span>,
        layer
      )}
    </span>
  );
}


