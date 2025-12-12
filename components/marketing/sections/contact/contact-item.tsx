import { cn } from "@/styles";
import * as React from "react";

export interface ContactItemProps {
  icon: React.ReactElement;
  label: string;
  value: string;
  href?: string;
  className?: string;
}

export const ContactItem = React.forwardRef<HTMLDivElement, ContactItemProps>(
  ({ icon, label, value, href, className }, ref) => {
    const renderValue = () =>
      value.split("\n").map((line, i, arr) => (
        <React.Fragment key={line || `line-${i}`}>
          {line}
          {i < arr.length - 1 && <br />}
        </React.Fragment>
      ));
    return (
      <div ref={ref} className={cn("flex items-start gap-md", className)}>
        <div className="flex-shrink-0 rounded-lg bg-primary/10 p-ms text-primary">
          {icon}
        </div>
        <div className="space-y-1">
          <h3 className="font-medium text-high">{label}</h3>
          {href ? (
            <a href={href} className="text-low transition-colors hover:text-primary">
              {renderValue()}
            </a>
          ) : (
            <p className="text-low">{renderValue()}</p>
          )}
        </div>
      </div>
    );
  },
);

ContactItem.displayName = "ContactItem";


