import ChatComposer from '@/components/chat/sections/chat-composer';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { axe } from 'vitest-axe';

describe('ChatComposer (client)', () => {
  it('accepts input and triggers onChange and onSend', () => {
    const onChange = vi.fn();
    const onSend = vi.fn();
    render(
      <ChatComposer
        value=""
        onChange={onChange}
        onSend={onSend}
        placeholder="Type…"
        mode={'projects'}
        setMode={() => {}}
        canSend={true}
      />
    );

    const ta = screen.getByPlaceholderText('Type…') as HTMLTextAreaElement;
    fireEvent.change(ta, { target: { value: 'hello' } });
    expect(onChange).toHaveBeenCalledWith('hello');

    fireEvent.keyDown(ta, { key: 'Enter' });
    expect(onSend).toHaveBeenCalled();
  });

  it('has no accessibility violations', async () => {
    const onChange = vi.fn();
    const onSend = vi.fn();
    const { container } = render(
      <ChatComposer
        value=""
        onChange={onChange}
        onSend={onSend}
        placeholder="Type…"
        mode={'projects'}
        setMode={() => {}}
        canSend={true}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
