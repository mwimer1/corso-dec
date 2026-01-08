// components/atoms/button.tsx
"use client";

import Link from "next/link";
import * as React from "react";

import { Spinner } from "@/components/ui/atoms/spinner";
import { cn } from "@/styles";
import { buttonVariants, type ButtonVariantProps } from "@/styles/ui/atoms";

// common to both render modes
type BaseProps = ButtonVariantProps & {
  loading?: boolean;
  loadingText?: string;
  asChild?: boolean;
};

/**
 * Local copy of the `useButton` helper previously imported from hooks/ui.
 * Inlined here to eliminate the atoms→hooks dependency and keep the button self-contained.
 */
function useButton({
  variant,
  size,
  fullWidth,
  className,
  loading,
  disabled,
  "aria-label": ariaLabel,
}: {
  variant?: ButtonVariantProps["variant"];
  size?: ButtonVariantProps["size"];
  fullWidth?: boolean;
  className?: string;
  loading?: boolean;
  disabled?: boolean;
  "aria-label"?: string;
}) {
  const classes = React.useMemo(
    () =>
      cn(buttonVariants({ variant, size }), fullWidth && "w-full", className),
    [variant, size, fullWidth, className],
  );

  const isDisabled = disabled || loading;

  const buttonProps = React.useMemo(
    () => ({
      className: classes,
      disabled: isDisabled,
      "aria-disabled": isDisabled,
      "aria-busy": loading,
      "aria-label": ariaLabel,
    }),
    [classes, isDisabled, loading, ariaLabel],
  );

  return { buttonProps, isDisabled, variant: variant ?? "default" } as const;
}

// Remove keys with undefined values to satisfy exactOptionalPropertyTypes when
// spreading props into components like next/link.
function omitUndefinedProps<T extends object>(obj: T): Partial<T> {
  const result: Partial<T> = {};
  for (const [key, value] of Object.entries(obj) as Array<[
    keyof T,
    T[keyof T],
  ]>) {
    if (value !== undefined) {
      (result as Record<string, unknown>)[key as string] = value as unknown;
    }
  }
  return result;
}

/* --- a) native <button> --- */
type NativeButtonProps = {
  asLink?: undefined; // ❌ not allowed
  asChild?: boolean;
} & React.ButtonHTMLAttributes<HTMLButtonElement> &
  BaseProps;

/* --- b) <a> inside next/link --- */
type LinkButtonProps = {
  asLink: string; // ✅ required
  asChild?: undefined; // ❌ not compatible with asLink
} & React.AnchorHTMLAttributes<HTMLAnchorElement> &
  BaseProps;

/* --- final API --- */
type ButtonProps = NativeButtonProps | LinkButtonProps;

type ButtonOrAnchor = HTMLButtonElement | HTMLAnchorElement;

export const Button = React.forwardRef<ButtonOrAnchor, ButtonProps>(
  (props, ref) => {
    const {
      loading = false,
      loadingText = "Loading…",
      children,
      asChild = false,
    } = props;

    const { buttonProps } = useButton({
      variant: props.variant,
      size: props.size,
      ...(props.fullWidth !== undefined && { fullWidth: props.fullWidth }),
      className: props.className ?? "",
      loading,
      disabled: "disabled" in props ? !!props.disabled : false,
    });

    const content = (
      <>
        {loading && (
          <Spinner size="sm" className="mr-sm" aria-label={loadingText} />
        )}
        {children}
      </>
    );

    // If asChild is true, render children directly with button styles applied
    if (asChild && React.isValidElement(children)) {
      const childElement = children as React.ReactElement<any, any>;
      return React.cloneElement(childElement, {
        ...(childElement.props as object),
        // Do not leak non-DOM props
        ...buttonProps,
        className:
          `${buttonProps.className} ${(childElement.props as any).className || ""}`.trim(),
        ref,
      });
    }

    /* ─────────  anchor path ───────── */
    const isLinkButton = (p: ButtonProps): p is LinkButtonProps =>
      (p as any).asLink !== undefined && typeof (p as any).asLink === "string";
    if (isLinkButton(props)) {
      const {
        asLink,
        loading: _l1,
        loadingText: _l2,
        href: _href,
        onMouseEnter: _onMouseEnter,
        onTouchStart: _onTouchStart,
        onClick: _onClick,
        ...anchorProps
      } = props;

      return (
        <Link
          href={asLink ?? ""}
          className={buttonProps.className}
          onClick={(e) => {
            if (buttonProps["aria-disabled"]) e.preventDefault();
          }}
          aria-disabled={buttonProps["aria-disabled"]}
          aria-busy={buttonProps["aria-busy"]}
          aria-label={buttonProps["aria-label"]}
          {...omitUndefinedProps(anchorProps)}
          ref={ref as React.Ref<HTMLAnchorElement>}
        >
          {content}
        </Link>
      );
    }

    /* ─────────  native button path ───────── */
    const {
      variant,
      size,
      fullWidth,
      className,
      asChild: _asChild,
      loading: _loading,
      loadingText: _loadingText,
      ...buttonSpecificProps
    } = props as NativeButtonProps;

    return (
      <button
        {...buttonSpecificProps}
        {...buttonProps}
        ref={ref as React.Ref<HTMLButtonElement>}
      >
        {content}
      </button>
    );
  },
);

Button.displayName = "Button";
