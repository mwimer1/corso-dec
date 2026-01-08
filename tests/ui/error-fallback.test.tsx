import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorFallback } from '@/components/ui/organisms';

describe('ErrorFallback', () => {
  it('renders error message and retry button', () => {
    const mockError = new Error('Test error message');
    const mockReset = vi.fn();

    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error message')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('calls resetErrorBoundary when retry button is clicked', async () => {
    const mockError = new Error('Another error');
    const mockReset = vi.fn();
    const user = userEvent.setup();

    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    const retryButton = screen.getByRole('button', { name: /try again/i });
    await user.click(retryButton);

    expect(mockReset).toHaveBeenCalledTimes(1);
  });

  it('displays error message in pre tag for better formatting', () => {
    const mockError = new Error('Multi-line\nerror message');
    const mockReset = vi.fn();

    render(<ErrorFallback error={mockError} resetErrorBoundary={mockReset} />);

    const preElement = document.querySelector('pre');
    expect(preElement).toBeInTheDocument();
    expect(preElement).toHaveTextContent('Multi-line\nerror message');
  });
});
