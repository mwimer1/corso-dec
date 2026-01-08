"use client";

import { MetricCard } from "@/components/ui/molecules";
import { formatCurrency } from "@/lib/shared";
import { TrendingUp } from "lucide-react";

type Props = { revenueGrowth: number; newDeals: number; workdaysSaved: number };

export function RoiOutputPanel({ revenueGrowth, newDeals, workdaysSaved }: Props) {
  return (
    <div
      className="
        grid gap-4 md:gap-5
        grid-cols-1 sm:grid-cols-2
        h-full
        grid-rows-[1fr_1fr]
      "
    >
      {/* Row 1: full width - Custom Revenue Growth card with icon */}
      <div className="sm:col-span-2 h-full">
        <section
          className="
            rounded-2xl border border-[hsl(var(--ring))] 
            bg-[hsl(var(--surface-selected))]/15 
            shadow-sm
            grid items-center
            grid-cols-[56px_1fr_56px] md:grid-cols-[72px_1fr_72px]
            min-h-[168px]
            p-4 md:p-6
            h-full
          "
          aria-label="Revenue Growth"
        >
          {/* Left gutter: Icon */}
          <div className="flex items-center justify-center">
            <TrendingUp 
              className="block w-12 h-12 md:w-16 md:h-16 text-[hsl(var(--ring))]" 
              aria-hidden="true"
            />
          </div>
          
          {/* Center column: KPI stack (true centered) */}
          <div className="flex flex-col items-center justify-center text-center">
            {/* Title */}
            <h3 className="text-sm md:text-base font-semibold tracking-tight text-[hsl(var(--foreground))] text-center mb-1.5 md:mb-2">
              Revenue Growth
            </h3>
            {/* Value - larger size */}
            <div 
              className="text-3xl md:text-4xl font-extrabold leading-none text-center mb-1.5 md:mb-2"
              aria-live="polite"
              aria-atomic="true"
            >
              {formatCurrency(revenueGrowth)}
            </div>
            {/* Helper text */}
            <p className="text-xs md:text-sm text-[hsl(var(--muted-foreground))] leading-relaxed text-center">
              Estimated annual lift with your current settings.
            </p>
          </div>

          {/* Right gutter: Spacer to balance icon column */}
          <div aria-hidden="true" />
        </section>
      </div>

      {/* Row 2: side-by-side, compact */}
      <MetricCard
        title="New Deals"
        value={`${newDeals.toLocaleString()} deals/yr`}
        helper="Projected additional wins at current close rate."
        density="compact"
        valueSize="sm"
        className="h-full"
      />
      <MetricCard
        title="Workdays Saved"
        value={`${workdaysSaved.toLocaleString()} days/yr`}
        helper="Annual automation time savings across your team (est.)."
        tone="success"
        density="compact"
        valueSize="sm"
        className="h-full"
      />
    </div>
  );
}


