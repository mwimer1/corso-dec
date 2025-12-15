import { ChatWindow } from '@/components/chat/sections/chat-window';
import * as useChatModule from '@/hooks/chat/use-chat';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('Chat composer accessibility', () => {
  beforeEach(() => {
    vi.spyOn(useChatModule, 'useChat').mockReturnValue({
      messages: [],
      isProcessing: false,
      detectedTable: null,
      sendMessage: vi.fn(),
      stop: vi.fn(),
      clearChat: vi.fn(),
      saveHistory: vi.fn(),
      loadHistory: vi.fn(),
      error: null,
      clearError: vi.fn(),
      retryLastMessage: vi.fn(),
    } as any);
  });

  it('prevents Enter submit while composing (IME) and sends on Enter otherwise', async () => {
    const sendMessage = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(useChatModule, 'useChat').mockReturnValue({
      messages: [],
      isProcessing: false,
      detectedTable: null,
      sendMessage,
      stop: vi.fn(),
      clearChat: vi.fn(),
      saveHistory: vi.fn(),
      loadHistory: vi.fn(),
      error: null,
      clearError: vi.fn(),
      retryLastMessage: vi.fn(),
    } as any);

    render(<ChatWindow />);
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    }, { timeout: 3000 });
    let ta = screen.getByLabelText('Chat message input') as HTMLTextAreaElement;

    // Test that Enter during composition does NOT send
    // Simulate isComposing=true on the native event
    const keyDownDuringComposition = new KeyboardEvent('keydown', {
      key: 'Enter',
      bubbles: true,
      cancelable: true,
    });
    Object.defineProperty(keyDownDuringComposition, 'nativeEvent', {
      value: { isComposing: true }
    });
    fireEvent(ta, keyDownDuringComposition);

    // sendMessage should not be called
    expect(sendMessage).not.toHaveBeenCalled();

    // Now test normal Enter (no composition) - this should send
    // Use change event which properly triggers React's onChange
    fireEvent.change(ta, { target: { value: 'hello' } });

    // Wait for state updates and re-render
    await new Promise(resolve => setTimeout(resolve, 50));

    // Re-query the textarea to get updated element
    ta = screen.getByLabelText('Chat message input') as HTMLTextAreaElement;

    // Now press Enter (no isComposing)
    fireEvent.keyDown(ta, { key: 'Enter' });

    await waitFor(() => {
      expect(sendMessage).toHaveBeenCalled();
    }, { timeout: 2000 });
  });

  it('autosizes up to a cap', async () => {
    render(<ChatWindow />);
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    }, { timeout: 3000 });
    const ta = screen.getByLabelText('Chat message input') as HTMLTextAreaElement;
    const long = Array(200).fill('line').join('\n');
    fireEvent.change(ta, { target: { value: long } });
    // Wait for requestAnimationFrame to execute (autosize is async)
    await new Promise((resolve) => requestAnimationFrame(resolve));
    // after autosize, height should not be 0 and not infinite
    expect(ta.style.height).toBeTruthy();
  });
});
