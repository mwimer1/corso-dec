// lib/shared/format/numbers.ts
// Compact number and currency formatters shared across the app

export function formatNumberCompact(n: number): string {
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return n.toLocaleString();
}

export function formatCurrencyCompact(n: number): string {
  const sign = n < 0 ? "-" : "";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${sign}$${(abs / 1e9).toFixed(1).replace(/\.0$/, "")}B`;
  if (abs >= 1e6) return `${sign}$${(abs / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
  if (abs >= 1e3) return `${sign}$${(abs / 1e3).toFixed(1).replace(/\.0$/, "")}K`;
  return `${sign}$${abs.toLocaleString()}`;
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



