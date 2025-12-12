// components/molecules/empty-state.tsx
import { cn } from "@/styles";
import {
  emptyStateActionsVariants,
  emptyStateDescriptionVariants,
  emptyStateHeadingVariants,
  emptyStateIconVariants,
} from "@/styles/ui/molecules";
import * as React from "react";

/** Subcomponents for composing empty states consistently */
function _EmptyStateIcon({
  children,
  size = "md",
  context = "default",
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  context?: "default" | "subtle" | "prominent";
  className?: string;
}) {
  return (
    <div className={cn(emptyStateIconVariants({ size, context }), className)}>
      {children}
    </div>
  );
}

function _EmptyStateTitle({
  children,
  size = "md",
  context = "default",
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  context?: "default" | "subtle" | "prominent";
  className?: string;
}) {
  return (
    <h3 className={cn(emptyStateHeadingVariants({ size, context }), className)}>
      {children}
    </h3>
  );
}

function _EmptyStateDescription({
  children,
  size = "md",
  context = "default",
  className,
}: {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  context?: "default" | "subtle" | "prominent";
  className?: string;
}) {
  return (
    <p className={cn(emptyStateDescriptionVariants({ size, context }), className)}>
      {children}
    </p>
  );
}

function _EmptyStateActions({
  children,
  size = "md",
  className,
}: {
  children?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  if (!children) return null;
  return (
    <div className={cn(emptyStateActionsVariants({ size }), className)}>
      {children}
    </div>
  );
}
