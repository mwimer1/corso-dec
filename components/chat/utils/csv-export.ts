'use client';

/**
 * CSV Export Utility for Chat Tables
 * 
 * Client-side utility to export table data as CSV files.
 * Handles special character escaping and proper CSV formatting.
 */

interface CSVColumn {
  id: string;
  label: string;
}

interface CSVRow {
  [key: string]: unknown;
}

/**
 * Escapes a CSV field value, handling special characters (commas, quotes, newlines)
 */
function escapeCSVField(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const stringValue = String(value);
  
  // If the value contains comma, quote, or newline, wrap in quotes and escape quotes
  if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n') || stringValue.includes('\r')) {
    // Escape quotes by doubling them
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
}

/**
 * Converts table data to CSV format
 */
function convertToCSV(columns: CSVColumn[], rows: CSVRow[]): string {
  // Create header row
  const headerRow = columns.map(col => escapeCSVField(col.label)).join(',');
  
  // Create data rows
  const dataRows = rows.map(row => {
    return columns.map(col => escapeCSVField(row[col.id])).join(',');
  });
  
  // Combine header and data rows
  return [headerRow, ...dataRows].join('\n');
}

/**
 * Exports table data as a CSV file
 * 
 * @param columns - Array of column definitions
 * @param rows - Array of row data objects
 * @param filename - Optional filename (defaults to timestamped filename)
 */
export function exportToCSV(
  columns: CSVColumn[],
  rows: CSVRow[],
  filename?: string
): void {
  try {
    // Validate inputs
    if (!columns || columns.length === 0) {
      throw new Error('No columns provided for CSV export');
    }

    if (!rows || rows.length === 0) {
      throw new Error('No rows provided for CSV export');
    }

    // Generate CSV content
    const csvContent = convertToCSV(columns, rows);
    
    // Generate filename if not provided
    const csvFilename = filename || `chat-table-${new Date().toISOString().replace(/[:.]/g, '-')}.csv`;
    
    // Create blob with CSV MIME type
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = csvFilename;
    link.style.display = 'none';
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    // Graceful degradation: log error but don't break the UI
    console.error('Failed to export CSV:', error);
    // Optionally show user-friendly error message
    if (error instanceof Error) {
      alert(`Failed to export CSV: ${error.message}`);
    } else {
      alert('Failed to export CSV. Please try again.');
    }
  }
}
