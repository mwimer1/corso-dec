"use client";

import { cn } from "@/styles";
import Image from "next/image";
import * as React from "react";

interface LogoDogProps extends Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'> {
  className?: string;
}

/**
 * Dog logo component that uses the SVG file from public directory.
 * Optimized for use in the sidebar with proper sizing and positioning.
 */
function LogoDog({ className, ...props }: LogoDogProps) {
  return (
    <Image
      src="/logo-dog.svg"
      alt="Corso"
      className={cn("h-full w-auto", className)}
      width={100}
      height={100}
      {...props}
    />
  );
}

LogoDog.displayName = "LogoDog";


