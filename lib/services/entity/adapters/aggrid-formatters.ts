'use client';

import { DateEffectiveValueFormatter, ValueCurrencyFormatter } from '@/components/dashboard/entity/shared/renderers/value-formatter';
import type { ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';

// Re-export existing formatters for consistency
export const dateFormatter = DateEffectiveValueFormatter;
export const currencyFormatter = ValueCurrencyFormatter;

// Additional formatters for the new config system
export const numberGetter = (params: any): number => {
  return Number(params.data?.[params.colDef.field || '']) || 0;
};

export const datetimeFormatter = (params: ValueFormatterParams): string => {
  if (!params.value) return '';
  const date = new Date(params.value);
  return date.toLocaleString('en-US', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

// Cell renderer for links (returns simple value, actual rendering handled by AG Grid)
export const linkRenderer = (params: ICellRendererParams) => {
  const value = params.value;
  if (!value) return '-';

  // For now, return the value - AG Grid will handle the rendering
  // In a full implementation, this would return a custom component
  return value;
};

