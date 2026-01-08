import type { ChartDataPoint } from "@/types/marketing";

/** Apply simulated multipliers based on territory/property selections */
export function filterSeries(
  base: ChartDataPoint[],
  options: { isDefaultTerritory: boolean; isAllPropertyType: boolean }
): ChartDataPoint[] {
  const { isDefaultTerritory, isAllPropertyType } = options;
  let next = [...base];
  if (!isDefaultTerritory) {
    next = next.map((i) => ({
      ...i,
      projectCount: Math.round(i.projectCount * 0.4),
      jobValue: Math.round(i.jobValue * 0.35),
    }));
  }
  if (!isAllPropertyType) {
    next = next.map((i) => ({
      ...i,
      projectCount: Math.round(i.projectCount * 0.25),
      jobValue: Math.round(i.jobValue * 0.3),
    }));
  }
  return next;
}

/** Slice a series by year range inclusive */
export function getRangeSlice(series: ChartDataPoint[], range: [number, number]) {
  const [min, max] = range;
  return series.filter((d) => d.year >= min && d.year <= max);
}

export function sumProjectCount(series: ChartDataPoint[]): number {
  return series.reduce((s, d) => s + d.projectCount, 0);
}

export function sumJobValue(series: ChartDataPoint[]): number {
  return series.reduce((s, d) => s + d.jobValue, 0);
}

export function averageJobValue(series: ChartDataPoint[]): number {
  const totalProjects = sumProjectCount(series);
  const totalJobValue = sumJobValue(series);
  return totalProjects > 0 ? totalJobValue / totalProjects : 0;
}



