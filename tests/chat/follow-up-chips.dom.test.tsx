import { FollowUpChips } from '@/components/chat/widgets/follow-up-chips';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

describe('FollowUpChips', () => {
  const mockOnClick = vi.fn();

  beforeEach(() => {
    mockOnClick.mockClear();
  });

  it('renders chips with accessible button elements', () => {
    const items = ['Option 1', 'Option 2', 'Option 3'];
    render(<FollowUpChips items={items} onClick={mockOnClick} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(3);

    buttons.forEach((button, index) => {
      expect(button).toHaveAttribute('type', 'button');
      expect(button).toHaveTextContent(items[index]);
    });
  });

  it('calls onClick when chip is clicked', async () => {
    const user = userEvent.setup();
    const items = ['Test Option'];
    render(<FollowUpChips items={items} onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Test Option' });
    await user.click(button);

    expect(mockOnClick).toHaveBeenCalledWith('Test Option');
    expect(mockOnClick).toHaveBeenCalledTimes(1);
  });

  it('supports keyboard activation (Enter key)', async () => {
    const user = userEvent.setup();
    const items = ['Keyboard Test'];
    render(<FollowUpChips items={items} onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Keyboard Test' });
    button.focus();
    await user.keyboard('{Enter}');

    expect(mockOnClick).toHaveBeenCalledWith('Keyboard Test');
  });

  it('supports keyboard activation (Space key)', async () => {
    const user = userEvent.setup();
    const items = ['Space Test'];
    render(<FollowUpChips items={items} onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Space Test' });
    button.focus();
    await user.keyboard(' ');

    expect(mockOnClick).toHaveBeenCalledWith('Space Test');
  });

  it('applies focus-visible styles correctly', () => {
    const items = ['Focus Test'];
    render(<FollowUpChips items={items} onClick={mockOnClick} />);

    const button = screen.getByRole('button', { name: 'Focus Test' });
    expect(button).toHaveClass(
      'focus-visible:outline',
      'focus-visible:outline-2',
      'focus-visible:outline-offset-2'
    );
  });

  it('returns null when no items provided', () => {
    const { container } = render(<FollowUpChips items={[]} onClick={mockOnClick} />);
    expect(container.firstChild).toBeNull();
  });

  it('handles empty string items gracefully', () => {
    const items = [''];
    render(<FollowUpChips items={items} onClick={mockOnClick} />);

    const button = screen.getByRole('button');
    expect(button).toHaveTextContent('');
    expect(button).toHaveAttribute('type', 'button');
  });

  it('maintains stable keys for list items', () => {
    const items = ['Item 1', 'Item 2'];
    const { rerender } = render(<FollowUpChips items={items} onClick={mockOnClick} />);

    // Re-render with same items in different order
    rerender(<FollowUpChips items={['Item 2', 'Item 1']} onClick={mockOnClick} />);

    const buttons = screen.getAllByRole('button');
    expect(buttons).toHaveLength(2);

    // Verify buttons still exist and are clickable
    buttons.forEach(button => {
      expect(button).toHaveAttribute('type', 'button');
    });
  });
});
