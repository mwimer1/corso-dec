"use client";

import { trackNavClick } from "@/components/ui/shared/analytics";
import Link, { type LinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { cloneElement, forwardRef, isValidElement, useMemo, type MouseEventHandler, type ReactNode } from "react";

type LinkTrackProps = LinkProps & {
  label: string;
  className?: string;
  children: ReactNode;
  target?: React.HTMLAttributeAnchorTarget;
  rel?: string;
};

export const LinkTrack = forwardRef<HTMLAnchorElement, LinkTrackProps>(function LinkTrack(
  { label, href, className, children, onClick, ...rest },
  ref
) {
  const pathname = usePathname();

  const hrefString = useMemo(() => {
    if (typeof href === "string") return href;
    try {
      return href.toString();
    } catch {
      return "";
    }
  }, [href]);

  const isActive = useMemo(() => {
    if (!pathname || !hrefString) return false;
    try {
      // normalize to path only
      const target = hrefString.startsWith("http") ? new URL(hrefString).pathname : hrefString;
      return pathname === target;
    } catch {
      return pathname === hrefString;
    }
  }, [pathname, hrefString]);

  const handleClick: MouseEventHandler<HTMLAnchorElement> = (e) => {
    try {
      const dest = hrefString || (typeof href === "string" ? href : "");
      trackNavClick(label, dest);
    } catch {
      // no-op by design
    }
    onClick?.(e);
  };

  // Remove undefined props before spreading into Link/anchor to satisfy
  // exactOptionalPropertyTypes and avoid passing invalid attributes.
  function omitUndefinedProps<T extends object>(obj: T): Partial<T> {
    const result: Partial<T> = {};
    for (const [key, value] of Object.entries(obj) as Array<[keyof T, T[keyof T]]>) {
      if (value !== undefined) (result as Record<string, unknown>)[String(key)] = value as unknown;
    }
    return result;
  }

  const isAnchorChild = isValidElement(children) && (children as React.ReactElement).type === 'a';

  if (isAnchorChild) {
    const anchor = children as React.ReactElement<any, 'a'>;
    const mergedProps = {
      ...(anchor.props || {}),
      ref,
      onClick: (e: React.MouseEvent<HTMLAnchorElement>) => {
        handleClick(e);
        anchor.props?.onClick?.(e);
      },
      ...(className ? { className } : {}),
      ...(isActive ? { 'aria-current': 'page' as const } : {}),
    } as any;

    return (
      <Link href={href} legacyBehavior {...omitUndefinedProps(rest)}>
        {cloneElement(anchor, mergedProps)}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      {...(className ? { className } : undefined)}
      {...(isActive ? { 'aria-current': 'page' as const } : undefined)}
      onClick={handleClick}
      {...omitUndefinedProps(rest)}
      ref={ref}
    >
      {children}
    </Link>
  );
});


