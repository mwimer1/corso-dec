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
    const onClick = (rest as any)?.onClick as React.MouseEventHandler<HTMLAnchorElement> | undefined;
    const onMouseEnter = (rest as any)?.onMouseEnter as React.MouseEventHandler<HTMLAnchorElement> | undefined;
    const onMouseLeave = (rest as any)?.onMouseLeave as React.MouseEventHandler<HTMLAnchorElement> | undefined;
    const titleProp = (rest as any)?.title as string | undefined;
    const ariaLabel = (rest as any)?.["aria-label"] as string | undefined;
    type AriaCurrent = React.AriaAttributes["aria-current"];
    const ariaCurrent = (rest as any)?.["aria-current"] as AriaCurrent;

    return (
      <NextLink
        href={href}
        className={classNames}
        ref={ref}
        {...(onClick ? { onClick } : undefined)}
        {...(onMouseEnter ? { onMouseEnter } : undefined)}
        {...(onMouseLeave ? { onMouseLeave } : undefined)}
        {...(titleProp ? { title: titleProp } : undefined)}
        {...(ariaLabel ? { ["aria-label"]: ariaLabel } : undefined)}
        {...(ariaCurrent ? { ["aria-current"]: ariaCurrent } : undefined)}
      >
        {children}
      </NextLink>
    );
  },
);

Link.displayName = "Link";
