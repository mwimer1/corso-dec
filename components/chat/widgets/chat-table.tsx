"use client";

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
  // Handle edge cases
  if (columns.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No columns to display
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No data to display
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className={`min-w-full ${compact ? 'text-sm' : ''}`}>
        {stickyHeader && (
          <thead className="sticky top-0 bg-white border-b">
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="text-left py-2 px-3 font-medium text-gray-900">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody className="divide-y divide-gray-200">
          {!stickyHeader && (
            <tr>
              {columns.map((column) => (
                <th key={column.id} className="text-left py-2 px-3 font-medium text-gray-900 bg-gray-50">
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
              <tr key={stableKey} className="hover:bg-gray-50">
                {columns.map((column) => (
                  <td key={column.id} className="py-2 px-3 text-gray-700">
                    {String(row[column.id] ?? '') || '-'}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
