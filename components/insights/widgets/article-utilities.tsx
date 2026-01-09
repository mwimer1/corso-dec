"use client";

import { Button } from "@/components/ui/atoms/button";
import { cn } from "@/styles";
import { ArrowUp, Check, Copy } from "lucide-react";
import usePrefersReducedMotion from "@/components/landing/hooks/use-prefers-reduced-motion";
import * as React from "react";

interface CopyLinkButtonProps {
  /** URL to copy */
  url: string;
  /** Additional CSS classes */
  className?: string;
  /** Variant for positioning */
  variant?: "header" | "inline";
}

/**
 * CopyLinkButton - Copies the current article URL to clipboard with success feedback.
 */
export function CopyLinkButton({
  url,
  className,
  variant: _variant = "header",
}: CopyLinkButtonProps): React.ReactElement {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = React.useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      // Reset after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (_err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        // Silent fail - user can manually copy
      }
    }
  }, [url]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => {
        void handleCopy();
      }}
      className={cn(
        "inline-flex",
        className
      )}
      aria-label={copied ? "Link copied!" : "Copy article link"}
    >
      {copied ? (
        <>
          <Check className="h-4 w-4 mr-2" aria-hidden="true" />
          <span className="sr-only">Link copied!</span>
          <span aria-hidden="true">Copied</span>
        </>
      ) : (
        <>
          <Copy className="h-4 w-4 mr-2" aria-hidden="true" />
          <span className="sr-only">Copy article link</span>
          <span className="hidden sm:inline" aria-hidden="true">
            Copy link
          </span>
        </>
      )}
    </Button>
  );
}

interface BackToTopButtonProps {
  /** Additional CSS classes */
  className?: string;
  /** Scroll offset from top (default: 0) */
  offset?: number;
}

/**
 * BackToTopButton - Fixed button that appears after scrolling, smoothly scrolls to top.
 */
export function BackToTopButton({
  className,
  offset = 0,
}: BackToTopButtonProps): React.ReactElement {
  const [isVisible, setIsVisible] = React.useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();

  React.useEffect(() => {
    const handleScroll = () => {
      // Show button after scrolling 400px
      setIsVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // Check initial state
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const handleClick = React.useCallback(() => {
    window.scrollTo({
      top: offset,
      behavior: prefersReducedMotion ? "auto" : "smooth",
    });
  }, [offset, prefersReducedMotion]);

  if (!isVisible) {
    return <></>;
  }

  return (
    <Button
      variant="default"
      size="sm"
      onClick={handleClick}
      className={cn(
        "fixed bottom-6 right-6 z-40 rounded-full shadow-lg",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      aria-label="Back to top"
    >
      <ArrowUp className="h-4 w-4" aria-hidden="true" />
      <span className="sr-only">Back to top</span>
    </Button>
  );
}
