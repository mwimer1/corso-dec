// components/ui/molecules/page-header.tsx\n'use client';

import { cn } from "@/styles";
import {
    pageHeaderActionsVariants,
    pageHeaderSubtitleVariants,
    pageHeaderTitleVariants,
    pageHeaderVariants,
    type PageHeaderActionsVariantProps,
    type PageHeaderSubtitleVariantProps,
    type PageHeaderTitleVariantProps,
    type PageHeaderVariantProps,
} from "@/styles/ui/molecules";
import * as React from "react";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
  titleClassName?: string;
  subtitleClassName?: string;
  actionsClassName?: string;
  /** Main size variant for the header container */
  size?: PageHeaderVariantProps["size"];
  /** Main alignment variant for the header */
  alignment?: PageHeaderVariantProps["alignment"];
  /** Main spacing variant for the header */
  spacing?: PageHeaderVariantProps["spacing"];
  /** Title size variant - defaults to the main size if not specified */
  titleSize?: PageHeaderTitleVariantProps["size"];
  /** Subtitle size variant - defaults to the main size if not specified */
  subtitleSize?: PageHeaderSubtitleVariantProps["size"];
  /** Actions spacing variant */
  actionsSpacing?: PageHeaderActionsVariantProps["spacing"];
  /** Actions alignment variant */
  actionsAlignment?: PageHeaderActionsVariantProps["alignment"];
}

/**
 * PageHeader – displays a page title, optional subtitle, and optional action elements (children).
 */
function PageHeader({
  title,
  subtitle,
  children,
  size = "lg",
  alignment = "left",
  spacing = "normal",
  titleSize,
  subtitleSize,
  actionsSpacing = "loose",
  actionsAlignment = "left",
  className,
  titleClassName,
  subtitleClassName,
  actionsClassName,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        pageHeaderVariants({
          size,
          alignment,
          spacing,
        }),
        className,
      )}
    >
      <h1
        className={cn(
          pageHeaderTitleVariants({ size: titleSize || size }),
          titleClassName,
        )}
      >
        {title}
      </h1>
      {subtitle && (
        <p
          className={cn(
            pageHeaderSubtitleVariants({ size: subtitleSize || size }),
            subtitleClassName,
          )}
        >
          {subtitle}
        </p>
      )}
      {children && (
        <div
          className={cn(
            pageHeaderActionsVariants({
              spacing: actionsSpacing,
              alignment: actionsAlignment,
            }),
            actionsClassName,
          )}
        >
          {children}
        </div>
      )}
    </header>
  );
}

export { PageHeader };
