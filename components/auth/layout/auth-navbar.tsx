"use client";

import { Logo } from "@/components/ui/atoms";
import { APP_LINKS } from '@/lib/shared';
import { cn } from "@/styles";
import { navbarLayout, navbarLogoVariants } from "@/styles/ui/organisms";
import { navbarStyleVariants } from "@/styles/ui/organisms/navbar-variants";
import Link from "next/link";

export function AuthNavbar({ className }: { className?: string }) {
  const layout = navbarLayout();
  const navbarStyles = navbarStyleVariants({ scrolled: false });

  return (
    <header className={cn(navbarStyles.navbar(), "shadow-none border-0 px-0 fixed top-0 left-0 right-0 z-50", className)}>
      <div className={layout.container()}>
        <div className={layout.left()}>
          <Link
            href={APP_LINKS.NAV.HOME}
            aria-label="Corso home"
            className={cn(layout.logoLink(), navbarLogoVariants(), "mr-md")}
          >
            <Logo />
          </Link>
        </div>
      </div>
    </header>
  );
}


