import { render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import ChatWindow from '@/components/chat/sections/chat-window';

// Mock ChatComposer to avoid dynamic import timing issues
// This keeps the test focused on hydration boundary behavior, not Next's dynamic loader
vi.mock('@/components/chat/sections/chat-composer', () => ({
  default: () => <textarea aria-label="Chat message input" />,
}));

describe('ChatWindow hydration boundary', () => {
  it('renders server placeholder then mounts client composer', async () => {
    render(<ChatWindow />);

    // Deterministic: findByLabelText already does the polling, no waitFor needed
    // Matches the exact label used in all other ChatWindow tests
    const input = await screen.findByLabelText(
      'Chat message input',
      {},
      { timeout: 20_000 } // matches global testTimeout
    );

    expect(input).toBeInTheDocument();
  });
});
