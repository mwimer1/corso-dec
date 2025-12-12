import { ChatWindow } from '@/components/chat';
import * as useChatModule from '@/hooks/chat/use-chat';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

// Note: ChatComposer Enter key functionality is tested separately in chat-composer.client.dom.test.tsx
// This integration test is complex due to dynamic imports, so we skip the Enter key test here

describe('ChatWindow', () => {
  it('renders header with CorsoAI and empty-state greeting', () => {
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

    render(<ChatWindow />);
    expect(screen.getByText('CorsoAI')).toBeInTheDocument();
    expect(screen.getByText(/Good (morning|afternoon|evening)/)).toBeInTheDocument();
    expect(
      screen.getByText(/Ask a question about permits, company activity, or address history/)
    ).toBeInTheDocument();
  });

  it('renders preset buttons in empty state', () => {
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

    render(<ChatWindow />);
    expect(screen.getByText('Show permits issued in the last 30 days')).toBeInTheDocument();
    expect(screen.getByText('Top 10 contractors by total job value YTD')).toBeInTheDocument();
    expect(screen.getByText('Which project types are trending this quarter?')).toBeInTheDocument();
  });

  it('sends a message when clicking preset buttons', async () => {
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
    } as unknown as ReturnType<typeof useChatModule.useChat>);

    render(<ChatWindow />);
    const presetButton = screen.getByText('Show permits issued in the last 30 days');
    fireEvent.click(presetButton);
    expect(sendMessage).toHaveBeenCalledWith('[mode:projects] Show permits issued in the last 30 days');
  });

  it('renders chat input after hydration', async () => {
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

    render(<ChatWindow />);
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    });
    expect(screen.getByPlaceholderText(/Ask anything about projects/)).toBeInTheDocument();
  });

  it.skip('sends a message when pressing Enter in chat input', async () => {
    // Skipped due to dynamic import complexity in tests
    // Enter key functionality is tested in chat-composer.client.dom.test.tsx
    expect(true).toBe(true);
  });

  it('disables input while processing', async () => {
    vi.spyOn(useChatModule, 'useChat').mockReturnValue({
      messages: [],
      isProcessing: true,
      detectedTable: null,
      sendMessage: vi.fn(),
      stop: vi.fn(),
      clearChat: vi.fn(),
      saveHistory: vi.fn(),
      loadHistory: vi.fn(),
      error: null,
      clearError: vi.fn(),
      retryLastMessage: vi.fn(),
    } as unknown as ReturnType<typeof useChatModule.useChat>);

    render(<ChatWindow />);
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    });
    const input = screen.getByLabelText('Chat message input');
    expect(input).toBeDisabled();
  });

  it('renders messages when there is chat history', () => {
    const mockMessages = [
      { id: '1', role: 'user' as const, content: 'Hello', timestamp: new Date().toISOString(), detectedTable: null },
      { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: new Date().toISOString(), detectedTable: null },
    ];

    vi.spyOn(useChatModule, 'useChat').mockReturnValue({
      messages: mockMessages,
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

    render(<ChatWindow />);
    expect(screen.getByRole('log')).toBeInTheDocument();
    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('shows send hint in screen reader text', async () => {
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

    render(<ChatWindow />);
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    });
    expect(screen.getByText('Enter to send · Shift+Enter for newline')).toBeInTheDocument();
  });
});
