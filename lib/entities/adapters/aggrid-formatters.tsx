'use client';

import type { ICellRendererParams, ValueFormatterParams } from 'ag-grid-community';
import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/atoms/badge';
import {
  getStatusStyle,
  getPropertyTypeStyle,
  getInsuranceStatusStyle,
  DESCRIPTION_KEYWORDS,
} from './cell-renderer-mappings';

// Date formatter - formats dates as MM/DD/YYYY
// These exports are consumed via namespace import in aggrid.ts
 
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
 
export const currencyFormatter = (params: ValueFormatterParams): string => {
  const value = Number(params.value) || 0;
  if (value === 0) return "-";
  return `$${Math.floor(value).toLocaleString("en-US")}`;
};

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
 
export const linkRenderer = LinkCellRenderer;

/**
 * Badge cell renderer - renders status and category values as colored badges
 * Uses contextual mapping based on column field name (status, property_type, etc.)
 */
const BadgeCellRenderer: React.FC<ICellRendererParams> = ({ value, colDef }) => {
  if (value === null || value === undefined || value === '') {
    return <span className="text-muted-foreground">-</span>;
  }

  const fieldName = colDef?.field || '';
  const valueStr = String(value);
  
  let style;
  if (fieldName.includes('status') || fieldName === 'status') {
    // Handle insurance_status separately
    if (fieldName === 'insurance_status') {
      style = getInsuranceStatusStyle(valueStr);
    } else {
      style = getStatusStyle(valueStr);
    }
  } else if (fieldName.includes('property_type') || fieldName.includes('category')) {
    style = getPropertyTypeStyle(valueStr);
  } else {
    // Default fallback for unknown fields
    style = { text: valueStr, variant: 'default' as const };
  }

  return <Badge color={style.variant}>{style.text}</Badge>;
};

export const badgeRenderer = BadgeCellRenderer;

/**
 * Formats a company name by cleaning legal suffixes and normalizing case
 */
function formatCompanyName(name: string): string {
  if (!name) return '';
  
  // Remove common legal suffixes and clean up
  let cleaned = name
    .replace(/,\s*(LLC|Inc\.?|Corp\.?|Corporation|L\.?P\.?|L\.?L\.?P\.?|LLP|PC|P\.?C\.?|PA|P\.?A\.?)[.,\s]*$/i, '')
    .replace(/^['"]|['"]$/g, '')
    .trim();
  
  // Title case normalization (preserve acronyms like DFW)
  const words = cleaned.split(/\s+/);
  const formatted = words.map(word => {
    // If it's all caps and 2+ chars, likely an acronym - keep as-is
    if (/^[A-Z]{2,}$/.test(word)) {
      return word;
    }
    // Otherwise, capitalize first letter, lowercase rest
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }).join(' ');
  
  return formatted || name;
}

/**
 * Extracts domain from URL for favicon service
 */
function extractDomain(url: string): string | null {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
    return urlObj.hostname;
  } catch {
    return null;
  }
}

/**
 * Company name cell renderer - displays company name with favicon and optional link
 */
const CompanyNameCellRenderer: React.FC<ICellRendererParams> = ({ value, data }) => {
  const [imgError, setImgError] = useState(false);
  
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  const companyName = formatCompanyName(String(value));
  const companyUrl = data?.company_url || data?.website || null;
  const domain = companyUrl ? extractDomain(companyUrl) : null;
  const faviconUrl = domain ? `https://www.google.com/s2/favicons?domain=${domain}&sz=16` : null;
  
  // Placeholder icon SVG (16x16 gray circle with building outline)
  const placeholderIcon = (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="opacity-50">
      <rect x="4" y="6" width="8" height="8" stroke="currentColor" strokeWidth="1.5" />
      <line x1="6" y1="9" x2="6" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="10" y1="9" x2="10" y2="12" stroke="currentColor" strokeWidth="1.5" />
      <line x1="7" y1="3" x2="9" y2="3" stroke="currentColor" strokeWidth="1.5" />
      <line x1="8" y1="3" x2="8" y2="6" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  const iconContent = faviconUrl && !imgError ? (
    // eslint-disable-next-line next/no-img-element -- Favicon from external service, 16x16 only
    <img
      src={faviconUrl}
      alt=""
      width={16}
      height={16}
      className="h-4 w-4 flex-shrink-0"
      onError={() => {
        setImgError(true);
      }}
    />
  ) : (
    placeholderIcon
  );

  const nameSpan = (
    <span className="flex-1 truncate font-semibold text-sm">
      {companyName}
    </span>
  );

  // If we have a URL, wrap icon in link
  if (companyUrl) {
    const sanitizedUrl = sanitizeUrl(companyUrl);
    return (
      <div className="flex items-center gap-2 w-full min-h-[22px]">
        <a
          href={sanitizedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-shrink-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring focus-visible:outline-offset-2 rounded"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          {iconContent}
        </a>
        {nameSpan}
      </div>
    );
  }

  // No URL - just show icon and name
  return (
    <div className="flex items-center gap-2 w-full min-h-[22px]">
      <span className="flex-shrink-0">{iconContent}</span>
      {nameSpan}
    </div>
  );
};

export const companyNameRenderer = CompanyNameCellRenderer;

/**
 * Highlights keywords in description text
 */
function highlightKeywords(text: string): React.ReactNode[] {
  if (!text) return [];
  
  // Split text while preserving delimiters
  const parts = text.split(/([\s,.!?;:()\[\]{}'"-])/);
  const keywordSet = new Set(DESCRIPTION_KEYWORDS.map(k => k.toLowerCase()));
  
  return parts.map((part, index) => {
    const normalized = part.toLowerCase().trim();
    const key = `${part}-${index}`;
    if (keywordSet.has(normalized) && part.trim().length > 0) {
      return <span key={key} className="font-bold">{part}</span>;
    }
    return <React.Fragment key={key}>{part}</React.Fragment>;
  });
}

/**
 * Description cell renderer - displays text with 2-line clamp and keyword highlighting
 */
const DescriptionCellRenderer: React.FC<ICellRendererParams> = ({ value }) => {
  if (!value) {
    return <span className="text-muted-foreground">-</span>;
  }

  const text = String(value);
  const highlighted = highlightKeywords(text);

  return (
    <div className="line-clamp-2 text-sm leading-5 overflow-hidden">
      {highlighted}
    </div>
  );
};

export const descriptionRenderer = DescriptionCellRenderer;

/**
 * Pill list cell renderer - displays comma-separated values as badges with overflow handling
 */
const PillListCellRenderer: React.FC<ICellRendererParams> = ({ value }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);

  // Parse comma-separated values (before conditional return to calculate length for useEffect)
  const values = value
    ? String(value)
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0)
    : [];

  // Measure available width and calculate how many pills fit
  useEffect(() => {
    if (!containerRef.current || values.length === 0) return;
    
    const measure = () => {
      const container = containerRef.current;
      if (!container) return;
      
      const width = container.getBoundingClientRect().width;
      setContainerWidth(width);
      
      // Estimate pill width (approximate: text width + padding + gap)
      // Use a conservative estimate: average 60px per pill + 4px gap
      const avgPillWidth = 64;
      const estimatedCount = Math.floor(width / avgPillWidth);
      
      // Clamp to valid range
      const count = Math.max(0, Math.min(values.length, estimatedCount));
      setVisibleCount(count);
    };

    measure();
    
    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(containerRef.current);
    
    return () => {
      resizeObserver.disconnect();
    };
  }, [values.length]);

  if (!value || values.length === 0) {
    return <span className="text-muted-foreground">-</span>;
  }

  // Default to showing all if measurement not ready
  const visible = visibleCount !== null ? visibleCount : values.length;
  const hidden = values.length - visible;
  const visibleValues = values.slice(0, visible);
  const hiddenValues = values.slice(visible);

  return (
    <div ref={containerRef} className="flex items-center gap-1 flex-wrap w-full">
      {visibleValues.map((val) => (
        <Badge key={val} color="secondary" className="text-xs px-2 py-0.5">
          {val}
        </Badge>
      ))}
      {hidden > 0 && (
        <Badge
          color="default"
          className="text-xs px-1.5 py-0.5 border"
          title={hiddenValues.join(', ')}
        >
          +{hidden}
        </Badge>
      )}
    </div>
  );
};

export const pillListRenderer = PillListCellRenderer;

/**
 * Loading skeleton cell renderer - displays placeholder while data loads
 */
const LoadingSkeletonCellRenderer: React.FC<ICellRendererParams> = () => {
  return (
    <div className="animate-pulse bg-muted rounded h-4 w-full max-w-[120px]" />
  );
};

export const loadingRenderer = LoadingSkeletonCellRenderer;

