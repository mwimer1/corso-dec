"use client";

import { useState } from 'react';
import { ChevronDown, ChevronUp, FileDown } from 'lucide-react';
import { cn } from '@/styles';
import { exportToCSV } from '../utils/csv-export';

interface ChatTableColumn {
  id: string;
  label: string;
}

interface ChatTableRow {
  [key: string]: unknown;
}

interface ChatTableProps {
  columns: ChatTableColumn[];
  rows: ChatTableRow[];
  compact?: boolean;
  stickyHeader?: boolean;
}

export function ChatTable({ columns, rows, compact = false, stickyHeader = false }: ChatTableProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  // Handle edge cases
  if (columns.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No columns to display
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground text-sm">
        No data to display
      </div>
    );
  }

  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const handleDownloadCSV = () => {
    exportToCSV(columns, rows);
  };

  return (
    <div className="space-y-2">
      {/* Controls bar */}
      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={handleToggleCollapse}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-surface-hover",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          )}
          aria-label={isCollapsed ? 'Expand table' : 'Collapse table'}
          aria-expanded={!isCollapsed}
        >
          {isCollapsed ? (
            <>
              <ChevronDown className="h-4 w-4" aria-hidden="true" />
              <span>Show table ({rows.length} rows)</span>
            </>
          ) : (
            <>
              <ChevronUp className="h-4 w-4" aria-hidden="true" />
              <span>Hide table</span>
            </>
          )}
        </button>
        <button
          type="button"
          onClick={handleDownloadCSV}
          className={cn(
            "flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-surface-hover",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1"
          )}
          aria-label="Download table as CSV"
        >
          <FileDown className="h-4 w-4" aria-hidden="true" />
          <span>Download CSV</span>
        </button>
      </div>

      {/* Table content */}
      {!isCollapsed && (
        <div className="overflow-x-auto">
          <table className={`min-w-full ${compact ? 'text-sm' : ''}`}>
        {stickyHeader && (
          <thead className="sticky top-0 bg-surface border-b">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="text-left py-2 px-3 font-medium text-foreground">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-border">
          {!stickyHeader && (
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="text-left py-2 px-3 font-medium text-foreground bg-surface-contrast">
                  {column.label}
                </th>
              ))}
            </tr>
          )}
          {rows.map((row, index) => {
            // Use first column value as stable key, fallback to hash of row data
            const firstColumnId = columns[0]?.id;
            const stableKey = firstColumnId ? String(row[firstColumnId]) : `row-${index}`;

            return (
              <tr key={stableKey} className="hover:bg-surface-hover">
                {columns.map((column) => (
                  <td key={column.id} className="py-2 px-3 text-foreground">
                    {String(row[column.id] ?? '') || '-'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
        </div>
      )}
      
      {/* Collapsed summary */}
      {isCollapsed && (
        <div className="p-3 text-sm text-muted-foreground bg-surface border border-border rounded-md">
          Table with {rows.length} row{rows.length !== 1 ? 's' : ''} and {columns.length} column{columns.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}
