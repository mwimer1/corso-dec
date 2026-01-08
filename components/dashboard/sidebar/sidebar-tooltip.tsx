"use client";

 import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useSidebarTooltipLayer } from './sidebar-tooltip-layer';
import styles from './sidebar.module.css';

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
      className={styles['tipTrigger']}
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
          className={styles['tooltip']}
           data-side={side}
           style={{
             top: pos.top,
             left: side === 'right' ? pos.left : undefined,
             right: side === 'left' ? `calc(100% - ${pos.left}px)` : undefined,
           }}
         >
           {label}
          <span className={styles['tooltipArrow']} aria-hidden="true" />
         </span>,
         layer
       )}
     </span>
   );
}


