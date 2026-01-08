// components/dashboard/sidebar/sidebar-top.tsx
"use client";

import { cn } from "@/styles";
import Image from "next/image";
import { memo } from "react";
import styles from './sidebar.module.css';

type Props = {
  isOpen: boolean;
  onToggle: () => void;
  sidebarId?: string; // default 'dashboard-sidebar'
};

export const SidebarTop = memo(function SidebarTop({
  isOpen,
  onToggle,
  sidebarId = "dashboard-sidebar",
}: Props) {
  return (
    <div
      className={cn(
        styles['top'],
        "flex h-14 items-center px-4",
        isOpen ? "gap-18 justify-between" : "justify-center"
      )}
      data-state={isOpen ? "open" : "closed"}
      role="banner"
    >
      {/* Logo (acts as toggle) */}
      <button
        type="button"
        onClick={onToggle}
        aria-label={isOpen ? "Collapse sidebar" : "Expand sidebar"}
        aria-controls="sidebar-nav"
        aria-expanded={isOpen}
        className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/5 transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        data-testid="sidebar-toggle"
      >
        <Image src="/favicon.ico" alt="Corso" width={24} height={24} />
        <span className="sr-only">{isOpen ? 'Collapse sidebar' : 'Expand sidebar'}</span>
      </button>

      {/* Secondary control visible only when open (restores previous UI) */}
      {isOpen && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Collapse sidebar"
          aria-controls={sidebarId}
          aria-expanded={isOpen}
          className="flex items-center justify-center w-10 h-10 rounded-lg hover:bg-black/5 transition-colors"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            aria-hidden="true"
            focusable="false"
            className="w-5 h-5 text-gray-600"
            xmlns="http://www.w3.org/2000/svg"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          >
            <g stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect width="7" height="18" x="3" y="3" rx="1"></rect>
              <rect width="7" height="7" x="14" y="3" rx="1"></rect>
              <rect width="7" height="7" x="14" y="14" rx="1"></rect>
            </g>
          </svg>
        </button>
      )}
    </div>
  );
});

SidebarTop.displayName = "SidebarTop";


