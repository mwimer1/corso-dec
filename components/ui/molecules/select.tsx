// components/ui/molecules/select.tsx
'use client';

import { cn } from "@/styles";
import { selectVariants, type SelectVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/** Native `size` attr clashes with variant → omit it. */
type NativeSelectProps = Omit<
  React.SelectHTMLAttributes<HTMLSelectElement>,
  "size"
>;

interface _SelectProps extends NativeSelectProps, SelectVariantProps {}

export const Select = React.forwardRef<HTMLSelectElement, _SelectProps>(
  function Select(
    { className, size = "md", state = "default", ...props },
    ref,
  ) {
    return (
      <select
        ref={ref}
        className={cn(selectVariants({ size, state }), className)}
        {...props}
      />
    );
  },
);
