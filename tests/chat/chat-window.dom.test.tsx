import { ChatWindow } from '@/components/chat';
import * as useChatModule from '@/components/chat/hooks/use-chat';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

describe('ChatWindow', () => {
  it('renders empty-state greeting without header', () => {
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
    // Chat no longer renders the CorsoAI header - it's handled by route group layout
    expect(screen.queryByText('CorsoAI')).not.toBeInTheDocument();
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
    // Allow time for dynamic import to resolve - increased timeout for test suite runs
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    }, { timeout: 5000 });
    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ask anything about projects/)).toBeInTheDocument();
    }, { timeout: 2000 });
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
    }, { timeout: 3000 });
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
    }, { timeout: 3000 });
    expect(screen.getByText('Enter to send · Shift+Enter for newline')).toBeInTheDocument();
  });

  it('composer remains visible and accessible after clicking preset button', async () => {
    const mockMessages = [
      { id: '1', type: 'user' as const, content: '[mode:projects] Show permits issued in the last 30 days', timestamp: new Date().toISOString() },
      { id: '2', type: 'assistant' as const, content: 'Processing your request...', timestamp: new Date().toISOString() },
    ];

    const sendMessage = vi.fn().mockImplementation(() => {
      // Simulate adding messages after preset click
      return Promise.resolve();
    });

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

    const { rerender } = render(<ChatWindow />);

    // Wait for composer to hydrate
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Initial state: composer should be visible
    const composer = screen.getByRole('region', { name: /message composer/i });
    expect(composer).toBeInTheDocument();
    expect(composer).toBeVisible();

    // Click a preset button
    const presetButton = screen.getByText('Show permits issued in the last 30 days');
    fireEvent.click(presetButton);

    // Verify sendMessage was called
    expect(sendMessage).toHaveBeenCalledWith('[mode:projects] Show permits issued in the last 30 days');

    // Simulate messages being added (hasHistory becomes true)
    vi.spyOn(useChatModule, 'useChat').mockReturnValue({
      messages: mockMessages,
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

    rerender(<ChatWindow />);

    // Wait for message list to appear
    await waitFor(() => {
      expect(screen.getByRole('log')).toBeInTheDocument();
    });

    // Composer should still be visible and accessible
    const composerAfter = screen.getByRole('region', { name: /message composer/i });
    expect(composerAfter).toBeInTheDocument();
    expect(composerAfter).toBeVisible();

    // Textarea should be present and focusable
    const textarea = screen.getByLabelText('Chat message input');
    expect(textarea).toBeInTheDocument();
    expect(textarea).not.toBeDisabled();
  });

  it('composer remains visible during processing state', async () => {
    vi.spyOn(useChatModule, 'useChat').mockReturnValue({
      messages: [
        { id: '1', type: 'user' as const, content: 'Test message', timestamp: new Date().toISOString() },
      ],
      isProcessing: true,
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

    // Wait for composer to hydrate
    await waitFor(() => {
      expect(screen.getByLabelText('Chat message input')).toBeInTheDocument();
    }, { timeout: 3000 });

    // Composer should be visible even during processing
    const composer = screen.getByRole('region', { name: /message composer/i });
    expect(composer).toBeInTheDocument();
    expect(composer).toBeVisible();

    // Input may be disabled during processing, but should still be present
    const textarea = screen.getByLabelText('Chat message input');
    expect(textarea).toBeInTheDocument();
    expect(textarea).toBeDisabled();

    // Stop button should be visible during processing
    expect(screen.getByText('Stop')).toBeInTheDocument();
  });
});
