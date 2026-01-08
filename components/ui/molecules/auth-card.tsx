// components/ui/molecules/auth-card.tsx\n'use client';

import { Card } from '@/components/ui/atoms';
import { cn } from "@/styles";
import { authCardVariants } from "@/styles/ui/molecules";
import React from "react";

interface AuthCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Card content */
  children: React.ReactNode;
  /** Visual variant */
  variant?: "default" | "elevated" | "ghost";
}

/**
 * Container component for auth forms with consistent styling
 * Moved to global UI for reusability across auth flows
 */
export const AuthCard = React.forwardRef<HTMLDivElement, AuthCardProps>(
  ({ variant = 'default', className, children, ...props }, ref) => {
    // Pass the variant through directly so `ghost` maps to the explicit
    // `ghost` variant defined in the style factory. Previously we remapped
    // `ghost` -> `default` which left an outer container visible in the UI.
    return (
      <Card
        ref={ref}
        elevated={variant === 'elevated'}
        variant={variant}
        className={cn(authCardVariants({ variant }), className)}
        {...props}
      >
        {children}
      </Card>
    );
  },
);
AuthCard.displayName = "AuthCard";
