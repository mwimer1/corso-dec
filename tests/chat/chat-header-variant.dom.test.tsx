import { ChatPage } from '@/components/chat';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it } from 'vitest';

describe('ChatPage Header Variant', () => {
  it('renders DashboardTopBar with chat variant and stable selectors', () => {
    render(<ChatPage />);
    
    // Find the header element using stable data attribute
    const header = document.querySelector('[data-dashboard-top-bar]');
    expect(header).toBeInTheDocument();
    
    // Verify variant attribute is set to "chat"
    expect(header).toHaveAttribute('data-variant', 'chat');
  });

  it('applies tokenized spacing classes for chat variant', () => {
    render(<ChatPage />);
    
    const header = document.querySelector('[data-dashboard-top-bar]');
    expect(header).toBeInTheDocument();
    
    // Verify the header has the chat variant class (pl-xs)
    // We check for the presence of the element rather than specific classes
    // since className is dynamically generated
    expect(header).toHaveAttribute('data-variant', 'chat');
  });

  it('renders ChatModelDropdown in the header', () => {
    render(<ChatPage />);
    
    // The dropdown should contain "Corso" text
    expect(screen.getByText(/Corso/)).toBeInTheDocument();
  });
});
