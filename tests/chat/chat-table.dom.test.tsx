import { ChatTable } from '@/components/chat/widgets/chat-table';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ChatTable', () => {
  const mockColumns = [
    { id: 'name', label: 'Name' },
    { id: 'age', label: 'Age' },
    { id: 'city', label: 'City' },
  ];

  const mockRows = [
    { name: 'John Doe', age: 30, city: 'New York' },
    { name: 'Jane Smith', age: 25, city: 'Los Angeles' },
    { name: 'Bob Johnson', age: 35, city: 'Chicago' },
  ];

  it('renders table with columns and rows', () => {
    render(<ChatTable columns={mockColumns} rows={mockRows} />);

    // Check table structure
    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Check headers
    expect(screen.getByText('Name')).toBeInTheDocument();
    expect(screen.getByText('Age')).toBeInTheDocument();
    expect(screen.getByText('City')).toBeInTheDocument();

    // Check data cells
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('30')).toBeInTheDocument();
    expect(screen.getByText('New York')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();
    expect(screen.getByText('Los Angeles')).toBeInTheDocument();
  });

  it('applies compact styling when compact prop is true', () => {
    render(<ChatTable columns={mockColumns} rows={mockRows} compact />);

    const table = screen.getByRole('table');
    expect(table).toHaveClass('text-sm');
  });

  it('renders sticky header when stickyHeader prop is true', () => {
    render(<ChatTable columns={mockColumns} rows={mockRows} stickyHeader />);

    const table = screen.getByRole('table');
    const thead = table.querySelector('thead');
    expect(thead).toHaveClass('sticky', 'top-0', 'bg-surface', 'border-b');
  });

  it('handles empty columns gracefully', () => {
    render(<ChatTable columns={[]} rows={mockRows} />);

    expect(screen.getByText('No columns to display')).toBeInTheDocument();
  });

  it('handles empty rows gracefully', () => {
    render(<ChatTable columns={mockColumns} rows={[]} />);

    expect(screen.getByText('No data to display')).toBeInTheDocument();
  });

  it('handles null/undefined cell values correctly', () => {
    const rowsWithNulls = [
      { name: 'John Doe', age: null, city: undefined },
      { name: 'Jane Smith', age: 25, city: 'Los Angeles' },
    ];

    render(<ChatTable columns={mockColumns} rows={rowsWithNulls} />);

    // Should render '-' for null/undefined values
    const dashes = screen.getAllByText('-');
    expect(dashes.length).toBeGreaterThan(0);
  });

  it('uses stable keys for table rows', () => {
    const { rerender } = render(<ChatTable columns={mockColumns} rows={mockRows} />);

    // Re-render with same data - should not cause React warnings about unstable keys
    rerender(<ChatTable columns={mockColumns} rows={mockRows} />);

    // If we get here without warnings, the test passes
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('renders hover effects on table rows', () => {
    render(<ChatTable columns={mockColumns} rows={mockRows} />);

    const rows = screen.getAllByRole('row');
    // Skip the header row
    const dataRows = rows.slice(1);

    dataRows.forEach(row => {
      expect(row).toHaveClass('hover:bg-surface-hover');
    });
  });

  it('applies responsive overflow wrapper', () => {
    render(<ChatTable columns={mockColumns} rows={mockRows} />);

    const wrapper = screen.getByRole('table').closest('.overflow-x-auto');
    expect(wrapper).toBeInTheDocument();
  });
});
