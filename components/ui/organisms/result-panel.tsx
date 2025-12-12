// components/organisms/result-panel.tsx
import { cn } from "@/styles";
import {
    resultPanelVariants,
    type ResultPanelVariantProps,
} from "@/styles/ui/organisms";
import * as React from "react";

interface ResultPanelProps
  extends React.HTMLAttributes<HTMLDivElement>,
    Omit<ResultPanelVariantProps, 'status' | 'padding'> {
  title?: string;
  children?: React.ReactNode;
  /** Back-compat: callers pass a status flag for visuals */
  status?: 'idle' | 'loading' | 'success' | 'error';
  /** Back-compat: callers sometimes pass spacing here */
  padding?: string | number;
}

/**
 * ResultPanel – Container for displaying search results or query output.
 */
function ResultPanel({
  title,
  children,
  className,
  status,
  padding,
  ...props
}: ResultPanelProps) {
  // Map extended status values to variant-compatible values
  const variantStatus = React.useMemo(() => {
    switch (status) {
      case 'idle':
      case 'loading':
        return 'default' as const;
      case 'success':
      case 'error':
        return status;
      default:
        return undefined;
    }
  }, [status]);

  // resultPanelVariants expects variant props; pass mapped status through but
  // do not assume padding is a variant — apply as inline style if provided.
  return (
    <div
      className={cn(resultPanelVariants({ status: variantStatus }), className)}
      style={padding ? { padding } : undefined}
      {...props}
    >
      {title && <h2 className="text-lg font-semibold mb-2">{title}</h2>}
      {children}
    </div>
  );
}

export { ResultPanel };
