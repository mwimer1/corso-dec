'use client';

import type { ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import React from 'react';

// Date formatter - formats dates as MM/DD/YYYY
// These exports are consumed via namespace import in aggrid.ts
// eslint-disable-next-line import/no-unused-modules
export const dateFormatter = (params: ValueFormatterParams): string => {
  if (params.value) {
    const date = new Date(params.value);
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const day = date.getDate().toString().padStart(2, "0");
    const year = date.getFullYear().toString();
    return `${month}/${day}/${year}`;
  }
  return "";
};

// Currency formatter - formats currency values with $ and commas, shows "-" for zero
// eslint-disable-next-line import/no-unused-modules
export const currencyFormatter = (params: ValueFormatterParams): string => {
  const value = Number(params.value) || 0;
  if (value === 0) return "-";
  return `$${Math.floor(value).toLocaleString("en-US")}`;
};

// Additional formatters for the new config system
// eslint-disable-next-line import/no-unused-modules
export const numberGetter = (params: any): number => {
  return Number(params.data?.[params.colDef.field || '']) || 0;
};

// eslint-disable-next-line import/no-unused-modules
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

/**
 * Sanitizes and normalizes a URL for safe rendering.
 * Ensures the URL has a protocol and is safe to use in an anchor tag.
 */
function sanitizeUrl(url: string): string {
  if (!url) return '';
  
  // Remove any whitespace
  const trimmed = url.trim();
  
  // If it already has a protocol, return as-is (after basic validation)
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
  
  // If it looks like a domain or email, add https://
  if (/^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/.test(trimmed) || trimmed.includes('@')) {
    // For email addresses, use mailto:
    if (trimmed.includes('@')) {
      return `mailto:${trimmed}`;
    }
    return `https://${trimmed}`;
  }
  
  // Otherwise, return as-is (might be a relative URL or invalid)
  return trimmed;
}

/**
 * React component for rendering clickable links in AG Grid cells.
 * Handles external links with proper security attributes.
 */
const LinkCellRenderer: React.FC<ICellRendererParams> = ({ value }) => {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  const url = sanitizeUrl(String(value));
  const isExternal = /^https?:\/\//i.test(url);
  const isEmail = url.startsWith('mailto:');
  const displayText = isEmail ? url.replace('mailto:', '') : value;

  // Prevent XSS by ensuring we don't render javascript: or data: URLs
  if (/^(javascript|data):/i.test(url)) {
    return <span className="text-muted-foreground">{displayText}</span>;
  }

  return (
    <a
      href={url}
      target={isExternal ? '_blank' : undefined}
      rel={isExternal ? 'noopener noreferrer' : undefined}
      className="text-primary hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded"
      onClick={(e) => {
        // Allow row selection to work - only stop propagation if clicking the link itself
        // This prevents the link click from selecting the row
        e.stopPropagation();
      }}
    >
      {displayText}
    </a>
  );
};

// Cell renderer for links - returns React component
// eslint-disable-next-line import/no-unused-modules
export const linkRenderer = LinkCellRenderer;

