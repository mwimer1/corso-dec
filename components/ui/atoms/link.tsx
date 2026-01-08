// components/atoms/link.tsx
// FILE: app/_components/ui/atoms/link.tsx

"use client";

import NextLink from "next/link";
import * as React from "react";

import { cn } from "@/styles";
import { linkVariants } from "@/styles/ui/atoms";

/**
 * Link – shared anchor abstraction.
 * • Internal paths → <NextLink> (client-side navigation)
 * • External URLs → <a target="_blank" rel="noopener noreferrer">
 * • Token-first styling, strict-TS safe via discriminated union.
 */

// Define discriminated union for LinkProps
interface InternalLinkProps
  extends Omit<
    React.AnchorHTMLAttributes<HTMLAnchorElement>,
    "href" | "target" | "rel"
  > {
  href: Parameters<typeof NextLink>[0]["href"];
  external?: false;
}
interface ExternalLinkProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  external: true;
}
type LinkProps = InternalLinkProps | ExternalLinkProps;

export const Link = React.forwardRef<HTMLAnchorElement, LinkProps>(
  ({ href, external = false, className, children, ...rest }, ref) => {
    const isExternal =
      external || (typeof href === "string" && /^https?:\/\//.test(href));
    const variant = isExternal ? "external" : "internal";

    const classNames = cn(linkVariants({ variant, className }));

    if (isExternal) {
      // External link – regular anchor
      return (
        <a
          href={typeof href === "string" ? href : String(href)}
          target="_blank"
          rel="noopener noreferrer"
          ref={ref}
          className={classNames}
          {...rest}
        >
          {children}
        </a>
      );
    }

    // Internal route – Next.js Link (forward select safe props)
    // Since we're in the internal branch, rest is Omit<InternalLinkProps, "href" | "external" | "className" | "children">
    // which extends AnchorHTMLAttributes, so it includes onClick, onMouseEnter, etc.
    // Extract only the props we need to pass to NextLink, avoiding undefined values for exactOptionalPropertyTypes
    const anchorProps = rest as Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href" | "target" | "rel" | "className" | "children">;
    const { 
      onClick, 
      onMouseEnter, 
      onMouseLeave, 
      title: titleProp, 
      "aria-label": ariaLabel, 
      "aria-current": ariaCurrent,
      id,
      tabIndex,
      role,
      "aria-describedby": ariaDescribedBy,
      "aria-labelledby": ariaLabelledBy,
    } = anchorProps;

    // Build props object only with defined values to satisfy exactOptionalPropertyTypes
    const nextLinkProps: React.ComponentProps<typeof NextLink> = {
      href,
      className: classNames,
      ref,
    };
    
    if (onClick) nextLinkProps.onClick = onClick;
    if (onMouseEnter) nextLinkProps.onMouseEnter = onMouseEnter;
    if (onMouseLeave) nextLinkProps.onMouseLeave = onMouseLeave;
    if (titleProp) nextLinkProps.title = titleProp;
    if (ariaLabel) nextLinkProps["aria-label"] = ariaLabel;
    if (ariaCurrent) nextLinkProps["aria-current"] = ariaCurrent;
    if (id) nextLinkProps.id = id;
    if (tabIndex !== undefined) nextLinkProps.tabIndex = tabIndex;
    if (role) nextLinkProps.role = role;
    if (ariaDescribedBy) nextLinkProps["aria-describedby"] = ariaDescribedBy;
    if (ariaLabelledBy) nextLinkProps["aria-labelledby"] = ariaLabelledBy;

    return (
      <NextLink {...nextLinkProps}>
        {children}
      </NextLink>
    );
  },
);

Link.displayName = "Link";
