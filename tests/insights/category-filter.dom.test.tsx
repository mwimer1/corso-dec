import { CategoryFilter } from '@/components/insights/category-filter';
import { fireEvent, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('CategoryFilter', () => {
  it('renders categories and fires onChange on click', () => {
    const categories = [{ key: 'tech', label: 'Technology', count: 5 }];
    const onChange = vi.fn();
    const { getByText } = render(
      <CategoryFilter
        categories={categories}
        value="tech"
        onChange={onChange}
      />
    );
    const btn = getByText('Technology');
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onChange).toHaveBeenCalledWith('tech');
  });
});
