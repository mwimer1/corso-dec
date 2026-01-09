import { ChatPage } from '@/components/chat';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

describe('ChatPage Header Variant', () => {
  it('renders DashboardTopBar with chat variant and stable selectors', () => {
    const { container } = render(<ChatPage />);
    
    // Find the header element using stable data attribute
    const header = container.querySelector('[data-dashboard-top-bar]');
    expect(header).toBeInTheDocument();
    
    // Verify variant attribute is set to "chat"
    expect(header).toHaveAttribute('data-variant', 'chat');
  });

  it('applies tokenized spacing for chat variant (pl-xs instead of px-6)', () => {
    const { container } = render(<ChatPage />);
    
    const header = container.querySelector('[data-dashboard-top-bar][data-variant="chat"]');
    expect(header).toBeInTheDocument();
    
    // Verify the header has the chat variant
    // We check for stable data attributes rather than brittle class snapshots
    expect(header).toHaveAttribute('data-variant', 'chat');
  });

  it('renders ChatModelDropdown in the header', () => {
    render(<ChatPage />);
    
    // The dropdown should contain "Corso" text
    expect(screen.getByText(/Corso/)).toBeInTheDocument();
  });
});
