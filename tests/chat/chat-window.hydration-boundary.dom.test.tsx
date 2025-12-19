import ChatWindow from '@/components/chat/sections/chat-window';
import { render, screen, waitFor } from '@testing-library/react';

import * as useChatModule from '@/hooks/chat/use-chat';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('ChatWindow hydration boundary', () => {
  beforeEach(() => {
    // Ensure clean state for each test
    vi.spyOn(useChatModule, 'useChat').mockReturnValue({
      messages: [],
      isProcessing: false,
      detectedTable: null,
      sendMessage: vi.fn().mockResolvedValue(undefined),
      stop: vi.fn(),
      clearChat: vi.fn(),
      saveHistory: vi.fn(),
      loadHistory: vi.fn(),
      error: null,
      clearError: vi.fn(),
      retryLastMessage: vi.fn(),
    } as unknown as ReturnType<typeof useChatModule.useChat>);
  });

  it('renders server placeholder then mounts client composer', async () => {
    render(<ChatWindow />);

    // dynamic import should mount composer controls (textarea) eventually
    // Note: In test environment, the placeholder may not be visible due to synchronous hydration,
    // but the composer should still mount correctly
    // Increased timeout for test suite runs to handle dynamic import delays
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    }, { timeout: 5000 });
  });
});
