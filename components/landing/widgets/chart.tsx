"use client";

// Market insights chart (Recharts)
import { formatCurrencyCompact, formatNumberCompact } from "@/lib/shared";
import type { ChartDataPoint } from "@/types/marketing";
import React, { useMemo } from "react";
import type { TooltipProps } from "recharts";
import {
    Bar,
    CartesianGrid,
    ComposedChart,
    Line,
    ResponsiveContainer,
    Tooltip,
    XAxis, YAxis
} from "recharts";

type Props = { data: ChartDataPoint[]; loading?: boolean; variant?: "card" | "bare" };

const CustomTooltip = ({ active, payload, label }: TooltipProps<number, string>) => {
  if (!active || !payload || !payload.length) return null;
  const project = payload.find((p) => p.dataKey === "projectCount");
  const job = payload.find((p) => p.dataKey === "jobValue");

  return (
    <div className="bg-background p-4 border border-border rounded-lg shadow-md text-sm md:text-base">
      <p className="font-semibold text-foreground mb-1">Year: {label}</p>
      {project && (
        <p className="text-primary flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-primary inline-block" />
          Projects: {formatNumberCompact(Number(project.value))}
        </p>
      )}
      {job && (
        <p className="text-success flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-sm bg-success inline-block" />
          Job Value: {formatCurrencyCompact(Number(job.value))}
        </p>
      )}
    </div>
  );
};

export const Chart: React.FC<Props> = ({ data, loading, variant = "card" }) => {
  const sorted = useMemo(() => [...data].sort((a, b) => a.year - b.year), [data]);
  const maxJob = useMemo(() => Math.max(...sorted.map(d => d.jobValue), 0) * 1.1 || 1, [sorted]);
  const maxProjects = useMemo(() => Math.max(...sorted.map(d => d.projectCount), 0) * 1.1 || 1, [sorted]);

  if (!sorted.length) {
    return (
      <div className={`${variant === "bare" ? "bg-transparent border-0 shadow-none rounded-none p-0 mb-8" : "bg-surface rounded-xl shadow-md border border-border p-6 mb-8"}`}>
        <div className="w-full h-64 md:h-80 flex items-center justify-center">
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            No data available for the selected range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${variant === "bare" ? "bg-transparent border-0 shadow-none rounded-none p-0 mb-8" : "bg-surface rounded-xl shadow-md border border-border p-6 mb-8"} transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
      <div className="w-full h-64 md:h-80">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sorted} margin={{ top: 20, right: 4, left: 0, bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={"hsl(var(--border))"} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fill: "currentColor", fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => formatCurrencyCompact(Number(v)).replace("$", "")}
              tick={{ fontSize: 12, fill: "currentColor", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxJob]}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => formatNumberCompact(Number(v))}
              tick={{ fontSize: 12, fill: "currentColor", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxProjects]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--foreground) / 0.06)" }} />
            <Bar yAxisId="right" dataKey="projectCount" name="Project Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
            <Line yAxisId="left" type="monotone" dataKey="jobValue" name="Job Value" stroke="hsl(var(--success, var(--primary)))" strokeWidth={3} dot={{ r: 5 }} activeDot={{ r: 7 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


