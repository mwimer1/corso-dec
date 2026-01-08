// lib/shared/format/numbers.ts
// Compact number and currency formatters shared across the app

export function formatNumberCompact(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", { notation: "compact", maximumFractionDigits: 1 }).format(n);
  } catch {
    return n.toLocaleString("en-US");
  }
}

export function formatCurrencyCompact(n: number): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 }).format(n);
  } catch {
    const sign = n < 0 ? "-" : "";
    return sign + "$" + Math.abs(n).toLocaleString("en-US");
  }
}

export function formatCurrency(
  value: number,
  currency: string = 'USD',
  locale: string = 'en-US',
): string {
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  } catch {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value);
  }
}

// Removed unused functions: formatWithCommas, formatDate, formatInt
// These functions were flagged as unused by the audit

/*
export function formatWithCommas(value: number): string {
  return value.toLocaleString();
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString();
}

export function formatInt(n: number, locale: string = 'en-US'): string {
  try {
    return Math.round(n).toLocaleString(locale);
  } catch {
    const x = Math.round(n);
    return String(x).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
}

export { formatInt as formatInteger };
*/



