/** Note: Indirectly consumed via AG Grid column definitions; allowlisted in unused-exports to avoid FP. */

import type { ValueFormatterParams } from "ag-grid-community";

// ClassificationFieldsValueFormatter removed - was unused

// Shared helpers (internal to this module to avoid cross-domain churn)
// Note: normalizeValue and formatZeroAsDash were removed as unused

// 2) Currency
export const ValueCurrencyFormatter = (params: ValueFormatterParams): string => {
  const value = Number(params.value) || 0;
  return value === 0
    ? "-"
    : `$${Math.floor(value).toLocaleString("en-US")}`;
};

export const DateEffectiveValueFormatter = (params: ValueFormatterParams) => {
    if (params.value) {
        const date = new Date(params.value);
        const month = (date.getMonth() + 1).toString().padStart(2, "0");
        const day = date.getDate().toString().padStart(2, "0");
        const year = date.getFullYear().toString();
        return `${month}/${day}/${year}`;
    }
    return ""
};

// ValueTextFormatter removed - was unused

