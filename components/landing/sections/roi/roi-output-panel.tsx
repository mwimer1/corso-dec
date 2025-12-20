"use client";

import { MetricCard } from "@/components/ui/molecules";
import { formatCurrency } from "@/lib/shared";

type Props = { revenueGrowth: number; newDeals: number; workdaysSaved: number };

export function RoiOutputPanel({ revenueGrowth, newDeals, workdaysSaved }: Props) {
  return (
    <div
      className="
        grid gap-4 md:gap-5
        grid-cols-1 sm:grid-cols-2
        auto-rows-min
      "
    >
      {/* Row 1: full width */}
      <div className="sm:col-span-2">
        <MetricCard
          title="Revenue Growth"
          value={formatCurrency(revenueGrowth)}
          helper="Estimated annual lift with your current settings."
          tone="brand"
          /* match bottom cards size so heights are identical */
          size="md"
          valueSize="sm"
          density="compact"
        />
      </div>

      {/* Row 2: side-by-side, compact */}
      <MetricCard
        title="New Deals"
        value={`${newDeals.toLocaleString()} deals/year`}
        helper="Projected additional wins at current close rate."
        density="compact"
        valueSize="sm"
      />
      <MetricCard
        title="Workdays Saved"
        value={`${workdaysSaved.toLocaleString()} days/year`}
        helper="Annual automation time savings across your team (est.)."
        tone="success"
        density="compact"
        valueSize="sm"
      />
    </div>
  );
}


