"use client";

// Market insights chart (Recharts)
import { formatCurrencyCompact, formatNumberCompact } from "@/lib/shared";
import { cn } from "@/styles";
import type { ChartDataPoint } from "@/types/marketing";
import React, { useMemo } from "react";
import type { TooltipProps } from "recharts";
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Label,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";

type Props = { data: ChartDataPoint[]; loading?: boolean; variant?: "card" | "bare"; heightClassName?: string };

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

export const Chart: React.FC<Props> = ({ data, loading, variant = "card", heightClassName }) => {
  const sorted = useMemo(() => [...data].sort((a, b) => a.year - b.year), [data]);
  const maxJob = useMemo(() => Math.max(...sorted.map(d => d.jobValue), 0) * 1.1 || 1, [sorted]);
  const maxProjects = useMemo(() => Math.max(...sorted.map(d => d.projectCount), 0) * 1.1 || 1, [sorted]);

  // Determine unit based on max value: use millions if max >= 1M, otherwise thousands
  const useMillionsJob = maxJob >= 1_000_000;
  const useMillionsProjects = maxProjects >= 1_000_000;

  // Format currency axis: all ticks in same unit (millions or thousands)
  // Ensures consistent units across all ticks on the axis
  const formatAxisCurrency = useMemo((): ((v: number) => string) => {
    return (v: number): string => {
      if (useMillionsJob) {
        // Convert to millions - all ticks will be in millions
        const millions = v / 1_000_000;
        // Format with 1 decimal for values >= 1, 2 decimals for values < 1, remove trailing zeros
        const formatted = millions >= 1 
          ? millions.toFixed(1) 
          : millions.toFixed(2);
        return `${formatted.replace(/\.?0+$/, '')}M`;
      } else {
        // Convert to thousands - all ticks will be in thousands
        if (v < 1000) return String(v);
        const thousands = v / 1_000;
        const formatted = thousands >= 1 
          ? thousands.toFixed(1) 
          : thousands.toFixed(2);
        return `${formatted.replace(/\.?0+$/, '')}k`;
      }
    };
  }, [useMillionsJob]);

  // Format number axis: all ticks in same unit (millions or thousands)
  const formatAxisNumber = useMemo((): ((v: number) => string) => {
    return (v: number): string => {
      if (useMillionsProjects) {
        // Convert to millions
        const millions = v / 1_000_000;
        const formatted = millions >= 1 
          ? millions.toFixed(1) 
          : millions.toFixed(2);
        return `${formatted.replace(/\.?0+$/, '')}M`;
      } else {
        // Convert to thousands
        if (v < 1000) return String(v);
        const thousands = v / 1_000;
        const formatted = thousands >= 1 
          ? thousands.toFixed(1) 
          : thousands.toFixed(2);
        return `${formatted.replace(/\.?0+$/, '')}k`;
      }
    };
  }, [useMillionsProjects]);

  if (!sorted.length) {
    return (
      <div className={`${variant === "bare" ? "bg-transparent border-0 shadow-none rounded-none p-0 mb-8" : "bg-surface rounded-xl shadow-md border border-border p-6 mb-8"}`}>
        <div className={cn("w-full h-64 md:h-80 flex items-center justify-center", heightClassName)}>
          <p className="text-sm text-muted-foreground" role="status" aria-live="polite">
            No data available for the selected range.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`${variant === "bare" ? "bg-transparent border-0 shadow-none rounded-none p-0" : "bg-surface rounded-xl shadow-md border border-border p-6"} transition-opacity ${loading ? "opacity-50" : "opacity-100"}`}>
      <div className={cn("w-full h-64 md:h-80", heightClassName)}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={sorted} margin={{ top: 30, right: 4, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={"hsl(var(--border))"} />
            <XAxis dataKey="year" tick={{ fontSize: 12, fontFamily: "var(--font-sans)", fill: "currentColor", fontWeight: 500 }} axisLine={{ stroke: "hsl(var(--border))" }} tickLine={false} />
            <YAxis
              yAxisId="left"
              tickFormatter={(v) => formatAxisCurrency(Number(v))}
              tick={{ fontSize: 12, fontFamily: "var(--font-sans)", fill: "currentColor", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxJob]}
            >
              <Label value="Job Value (USD)" angle={-90} position="insideLeft" fill="currentColor" fontSize={12} fontFamily="var(--font-sans)" fontWeight={500} />
            </YAxis>
            <YAxis
              yAxisId="right"
              orientation="right"
              tickFormatter={(v) => formatAxisNumber(Number(v))}
              tick={{ fontSize: 12, fontFamily: "var(--font-sans)", fill: "currentColor", fontWeight: 500 }}
              axisLine={false}
              tickLine={false}
              domain={[0, maxProjects]}
            >
              <Label value="Projects (Count)" angle={90} position="insideRight" fill="currentColor" fontSize={12} fontFamily="var(--font-sans)" fontWeight={500} />
            </YAxis>
            <Tooltip content={<CustomTooltip />} cursor={{ fill: "hsl(var(--foreground) / 0.06)" }} />
            <Legend verticalAlign="top" height={36} wrapperStyle={{ fontFamily: "var(--font-sans)", fontSize: "0.875rem", fontWeight: 500 }} />
            <Bar yAxisId="right" dataKey="projectCount" name="Project Count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={24} />
            <Line yAxisId="left" type="monotone" dataKey="jobValue" name="Job Value" stroke="hsl(var(--success, var(--primary)))" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};


