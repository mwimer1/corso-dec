// lib/marketing/roi.ts
// Pure, edge-safe ROI calculation utilities (no window/process usage)

export interface RoiInput {
  leads: number;
  closeRate: number; // percent, 0-100
  dealSize: number; // dollars
}

export interface RoiOutput {
  newDeals: number;
  workdaysSaved: number;
  sleepHours: number;
  totalRevenue: number;
}

export const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

export const parseIntStrict = (s: string) => {
  const n = Number(s);
  return Number.isFinite(n) ? Math.trunc(n) : 0;
};

export function calcRoi({ leads, closeRate, dealSize }: RoiInput): RoiOutput {
  const newDeals = Math.round((leads * closeRate) / 100);
  const workdaysSaved = Math.round((leads * 2) / 8);
  const sleepHours = workdaysSaved * 2;
  const totalRevenue = newDeals * dealSize;
  return { newDeals, workdaysSaved, sleepHours, totalRevenue };
}
// Prefer shared compact currency formatter from '@/lib/shared'
import { formatCurrencyCompact } from '@/lib/shared';

export function formatCompactCurrency(n: number): string {
  return formatCurrencyCompact(n);
}



