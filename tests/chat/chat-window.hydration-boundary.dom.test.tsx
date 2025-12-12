import ChatWindow from '@/components/chat/sections/chat-window';
import { render, screen, waitFor } from '@testing-library/react';

describe('ChatWindow hydration boundary', () => {
  it('renders server placeholder then mounts client composer', async () => {
    render(<ChatWindow />);

    // placeholder should be present immediately (aria-hidden shell)
    const placeholders = screen.getAllByRole('region', { hidden: true });
    expect(placeholders.length).toBeGreaterThan(0);

    // dynamic import should mount composer controls (textarea) eventually
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    });
  });
});
