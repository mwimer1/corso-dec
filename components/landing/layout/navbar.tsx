"use client";

// components/landing/navbar.tsx
// Landing page navbar wrapper around shared UI navbar with analytics


import { Navbar } from "@/components/ui/organisms";
import type { NavItemData } from "@/types/shared";
import { getLandingNavItems } from "./nav.config";

interface LandingNavbarProps {
  /** Optional override for primary nav items (landing only) */
  items?: NavItemData[];
}

export function LandingNavbar({ items }: LandingNavbarProps) {
  const navItems = getLandingNavItems(items);

  return (
    <Navbar
      mode="landing"
      items={navItems}
      forceShowCTAs={true}
    />
  );
}
