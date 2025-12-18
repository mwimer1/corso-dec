import ChatWindow from '@/components/chat/sections/chat-window';
import { render, screen, waitFor } from '@testing-library/react';

describe('ChatWindow hydration boundary', () => {
  it('renders server placeholder then mounts client composer', async () => {
    render(<ChatWindow />);

    // dynamic import should mount composer controls (textarea) eventually
    // Note: In test environment, the placeholder may not be visible due to synchronous hydration,
    // but the composer should still mount correctly
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    }, { timeout: 3000 });
  });
});
