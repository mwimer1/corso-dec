// components/ui/molecules/text-area.tsx
'use client';

import { cn } from "@/styles";
import { textAreaVariants, type TextAreaVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/**
 * TextArea – a multi-line text input field.
 * Supports `size` variants and a `state` variant (default or error).
 */
interface TextAreaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    TextAreaVariantProps {}

export const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
  function TextArea(
    { className, size = "md", state = "default", ...props },
    ref,
  ) {
    return (
      <textarea
        ref={ref}
        className={cn(textAreaVariants({ size, state }), className)}
        {...props}
      />
    );
  },
);
