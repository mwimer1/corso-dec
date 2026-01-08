// components/ui/atoms/input.tsx\n// FILE: app/_components/ui/atoms/input.tsx
import { cn } from "@/styles";
import { inputVariants, type InputVariantProps } from "@/styles/ui/atoms";
import * as React from "react";

/** Props for Input component (extends native input attributes). */
interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    InputVariantProps {
  /** Adds left padding to accommodate an inline icon */
  iconPadding?: boolean;
}

/** 🟢 Atom: Text input field, token-styled, with optional icon padding and size variants. */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input(
    {
      className,
      iconPadding = false,
      size = "md",
      variant = "default",
      ...props
    },
    ref,
  ) {
    // Note: Pattern intentionally mirrors other atoms (e.g., Skeleton) and
    // molecules (Select/TextArea): forwardRef + cn(variants, className).
    return (
      <input
        ref={ref}
        className={cn(
          inputVariants({ size, variant }),
          iconPadding && "pl-8", // tokenized padding for icon
          className,
        )}
        {...props}
      />
    );
  },
);
Input.displayName = "Input";
