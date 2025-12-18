import { SegmentedControl } from '@/components';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('SegmentedControl', () => {
  it('renders buttons with correct spacing classes', () => {
    const { container } = render(
      <SegmentedControl
        value="projects"
        onChange={() => {}}
        options={[
          { id: 'projects', label: 'Projects' },
          { id: 'companies', label: 'Companies' },
          { id: 'addresses', label: 'Addresses' },
        ]}
      />
    );

    const tabList = container.querySelector('div[role="tablist"]');
    expect(tabList).toBeInTheDocument();
    expect(tabList).toHaveClass('flex');
    expect(tabList).toHaveClass('gap-1');

    // Verify all buttons are rendered
    const buttons = container.querySelectorAll('button[role="tab"]');
    expect(buttons).toHaveLength(3);
    expect(screen.getByText('Projects')).toBeInTheDocument();
    expect(screen.getByText('Companies')).toBeInTheDocument();
    expect(screen.getByText('Addresses')).toBeInTheDocument();
  });

  it('applies custom className while preserving flex and gap classes', () => {
    const { container } = render(
      <SegmentedControl
        value="projects"
        onChange={() => {}}
        options={[{ id: 'projects', label: 'Projects' }]}
        className="custom-class"
      />
    );

    const tabList = container.querySelector('div[role="tablist"]');
    expect(tabList).toHaveClass('flex');
    expect(tabList).toHaveClass('gap-1');
    expect(tabList).toHaveClass('custom-class');
  });

  it('handles undefined className prop', () => {
    const { container } = render(
      <SegmentedControl
        value="projects"
        onChange={() => {}}
        options={[{ id: 'projects', label: 'Projects' }]}
      />
    );

    const tabList = container.querySelector('div[role="tablist"]');
    expect(tabList).toHaveClass('flex');
    expect(tabList).toHaveClass('gap-1');
  });
});
