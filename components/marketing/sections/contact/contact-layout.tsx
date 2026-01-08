import { SectionHeader } from "@/components/ui/patterns";
import { cn } from "@/styles";
import { containerMaxWidthVariants } from "@/styles/ui/shared/container-base";
import * as React from "react";

interface ContactLayoutProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
}

export const ContactLayout = React.forwardRef<
  HTMLDivElement,
  ContactLayoutProps
>(
  (
    {
      title = "Contact Us",
      subtitle = "Let's discuss how Corso can transform your construction intelligence",
      className,
      children,
      ...props
    },
    ref,
  ) => {
    return (
      <div
        ref={ref}
        className={cn(
          containerMaxWidthVariants({ maxWidth: '7xl', centered: true }),
          "px-md py-4xl sm:px-lg lg:px-xl",
          className,
        )}
        {...props}
      >
        {/* Header */}
        <div className={cn(containerMaxWidthVariants({ maxWidth: '2xl', centered: true }), "text-center")}> 
          <SectionHeader headingLevel={1} align="center" title={title} subtitle={subtitle} />
        </div>

        {/* Content */}
        <div className={cn(containerMaxWidthVariants({ maxWidth: '5xl', centered: true }), "mt-16")}>
          <div className="grid grid-cols-1 gap-3xl lg:grid-cols-2">
            {children}
          </div>
        </div>
      </div>
    );
  },
);

ContactLayout.displayName = "ContactLayout";
