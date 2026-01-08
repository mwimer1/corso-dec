import { SectionShell } from "@/components/ui/organisms/section-shell";
import * as React from "react";

type LandingSectionTone = "surface" | "muted" | "brand" | "dark";

interface LandingSectionProps extends React.HTMLAttributes<HTMLElement> {
  tone?: LandingSectionTone;
  guidelines?: React.ReactNode;
}

export function LandingSection({
  tone = "surface",
  guidelines,
  className,
  children,
  ...rest
}: LandingSectionProps) {
  return (
    <SectionShell
      tone={tone}
      {...(guidelines ? { guidelines } : {})}
      className={className}
      {...rest}
    >
      {children}
    </SectionShell>
  );
}


