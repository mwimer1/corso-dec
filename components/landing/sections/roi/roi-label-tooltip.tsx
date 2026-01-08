"use client";

import React, { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";

type Props = {
  /** The label text to display (will be wrapped with tooltip trigger) */
  children: React.ReactNode;
  /** The assumption text(s) to show in the tooltip */
  assumptions: string | string[];
  /** Optional ID for the tooltip (auto-generated if not provided) */
  id?: string;
  /** Position preference for tooltip (default: 'top') */
  position?: "top" | "bottom" | "left" | "right";
};

/**
 * Reusable tooltip component for ROI calculator input labels.
 * Shows assumptions on hover/focus with proper positioning and accessibility.
 */
export function RoiLabelTooltip({
  children,
  assumptions,
  id,
  position = "top",
}: Props) {
  const fallbackId = useId();
  const tooltipId = id ?? `roi-tooltip-${fallbackId}`;
  const [isOpen, setIsOpen] = useState(false);
  const [tooltipPos, setTooltipPos] = useState<{
    left: number;
    top: number;
  } | null>(null);
  const [tooltipDimensions, setTooltipDimensions] = useState<{
    width: number;
    height: number;
  } | null>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const closeTimerRef = useRef<number | null>(null);
  // Store latest updateTooltipPos in a ref to avoid circular dependency issues
  const updateTooltipPosRef = useRef<() => void>(() => {});

  const clearCloseTimer = useCallback(() => {
    if (closeTimerRef.current) {
      window.clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  }, []);

  const updateTooltipPos = useCallback(() => {
    const trigger = triggerRef.current;
    const tooltip = tooltipRef.current;
    if (!trigger) return;

    const rect = trigger.getBoundingClientRect();
    // Use measured dimensions if available, otherwise fallback to defaults
    const tooltipWidth = tooltipDimensions?.width ?? (tooltip?.offsetWidth ?? 320);
    const tooltipHeight = tooltipDimensions?.height ?? (tooltip?.offsetHeight ?? 120);
    const margin = 16;
    const gap = 8;

    let left = 0;
    let top = 0;

    switch (position) {
      case "top":
        // Position tooltip above the trigger with gap, left-aligned with trigger
        left = rect.left;
        // Position above: trigger top - tooltip height - gap
        top = rect.top - tooltipHeight - gap;
        // Keep within viewport horizontally - if tooltip would overflow, shift left
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = window.innerWidth - tooltipWidth - margin;
        }
        // Ensure minimum left margin
        left = Math.max(margin, left);
        // If not enough space above, show below instead
        if (top < margin) {
          top = rect.bottom + gap;
        }
        break;
      case "bottom":
        // Left-align with trigger
        left = rect.left;
        top = rect.bottom + gap;
        // Keep within viewport horizontally
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = window.innerWidth - tooltipWidth - margin;
        }
        left = Math.max(margin, left);
        break;
      case "left":
        left = rect.left - tooltipWidth - gap;
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        if (left < margin) {
          left = rect.right + gap;
        }
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
        break;
      case "right":
        left = rect.right + gap;
        top = rect.top + rect.height / 2 - tooltipHeight / 2;
        if (left + tooltipWidth > window.innerWidth - margin) {
          left = rect.left - tooltipWidth - gap;
        }
        top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
        break;
    }

    setTooltipPos({ left, top });
  }, [position, tooltipDimensions]);

  // Keep ref updated with latest function
  updateTooltipPosRef.current = updateTooltipPos;

  const openTooltip = useCallback(() => {
    clearCloseTimer();
    updateTooltipPos();
    setIsOpen(true);
  }, [clearCloseTimer, updateTooltipPos]);

  const scheduleCloseTooltip = useCallback(() => {
    clearCloseTimer();
    closeTimerRef.current = window.setTimeout(() => setIsOpen(false), 120);
  }, [clearCloseTimer]);

  // Measure tooltip dimensions after render
  useEffect(() => {
    if (!isOpen || !tooltipRef.current) return;

    const measureTooltip = () => {
      if (tooltipRef.current) {
        const { offsetWidth, offsetHeight } = tooltipRef.current;
        const newDimensions = { width: offsetWidth, height: offsetHeight };
        
        // Only update if dimensions actually changed to prevent unnecessary re-renders
        setTooltipDimensions((prev) => {
          if (prev?.width === newDimensions.width && prev?.height === newDimensions.height) {
            return prev;
          }
          return newDimensions;
        });
      }
    };

    // Measure after a brief delay to ensure tooltip is rendered
    const timeoutId = window.setTimeout(measureTooltip, 0);
    return () => window.clearTimeout(timeoutId);
  }, [isOpen]); // Removed updateTooltipPos from dependencies to break circular dependency

  // Separate effect to update position when dimensions are measured or change
  useEffect(() => {
    if (!isOpen || !tooltipDimensions) return;
    updateTooltipPos();
  }, [isOpen, tooltipDimensions, updateTooltipPos]);

  // Keep tooltip anchored on scroll/resize while open
  useEffect(() => {
    if (!isOpen) return;
    // Use ref to call latest function without dependency
    updateTooltipPosRef.current();

    const onScroll = () => updateTooltipPosRef.current();
    const onResize = () => updateTooltipPosRef.current();

    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [isOpen]); // Removed updateTooltipPos from dependencies to break circular dependency

  // Close on Escape / outside click
  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };

    const onPointerDown = (e: PointerEvent) => {
      const target = e.target as Node | null;
      if (!target) return;
      if (triggerRef.current?.contains(target)) return;
      if (tooltipRef.current?.contains(target)) return;
      setIsOpen(false);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown, true);
    };
  }, [isOpen]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      clearCloseTimer();
    };
  }, [clearCloseTimer]);

  const assumptionsArray = Array.isArray(assumptions)
    ? assumptions
    : [assumptions];

  return (
    <>
      <span
        ref={triggerRef}
        onMouseEnter={openTooltip}
        onMouseLeave={scheduleCloseTooltip}
        onFocus={openTooltip}
        onBlur={scheduleCloseTooltip}
        aria-describedby={isOpen ? tooltipId : undefined}
        className="cursor-pointer block w-full text-left"
        role="button"
        tabIndex={0}
        aria-label="View assumptions"
      >
        {children}
      </span>
      {isOpen &&
        tooltipPos &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            aria-live="polite"
            onMouseEnter={openTooltip}
            onMouseLeave={scheduleCloseTooltip}
            style={{
              left: `${tooltipPos.left}px`,
              top: `${tooltipPos.top}px`,
              transform:
                position === "top"
                  ? "translateY(0)" // Position already calculated correctly above
                  : position === "bottom"
                    ? "translateY(0)"
                    : position === "left"
                      ? "translate(-100%, -50%)"
                      : "translate(0, -50%)",
            }}
            className="fixed z-[80] w-[320px] max-w-[calc(100vw-2rem)] rounded-lg border border-border bg-popover p-3 text-sm leading-normal text-popover-foreground shadow-lg pointer-events-auto"
          >
            <div className="space-y-1">
              {assumptionsArray.map((assumption) => (
                <p key={assumption}>{assumption}</p>
              ))}
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
