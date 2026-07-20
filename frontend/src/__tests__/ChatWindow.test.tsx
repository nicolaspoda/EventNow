import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChatWindow } from '../components/messages/ChatWindow';
import type { Message } from '../services/messageService';

beforeEach(() => {
  Element.prototype.scrollIntoView = vi.fn();
});

function makeMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: 'm1',
    conversationId: 'c1',
    senderId: 'other-1',
    content: 'Salut !',
    createdAt: '2026-01-01T10:00:00.000Z',
    updatedAt: '2026-01-01T10:00:00.000Z',
    sender: { id: 'other-1', username: 'bob', email: 'bob@example.com' },
    ...overrides,
  };
}

describe('ChatWindow - rendering messages', () => {
  it('renders a message bubble with the sender name for others’ messages', () => {
    render(<ChatWindow messages={[makeMessage()]} currentUserId="me" onSendMessage={vi.fn()} />);

    expect(screen.getByText('Salut !')).toBeInTheDocument();
    expect(screen.getByText('bob')).toBeInTheDocument();
  });

  it('does not show the sender name for the current user’s own messages', () => {
    render(
      <ChatWindow
        messages={[makeMessage({ senderId: 'me', content: 'Coucou' })]}
        currentUserId="me"
        onSendMessage={vi.fn()}
      />,
    );

    expect(screen.getByText('Coucou')).toBeInTheDocument();
    expect(screen.queryByText('bob')).not.toBeInTheDocument();
  });

  it('groups messages under a date separator', () => {
    render(<ChatWindow messages={[makeMessage()]} currentUserId="me" onSendMessage={vi.fn()} />);

    expect(screen.getByText('01 janvier 2026')).toBeInTheDocument();
  });

  it('shows the "load more" button only when hasMore is true, and calls onLoadMore', () => {
    const onLoadMore = vi.fn();
    const { rerender } = render(
      <ChatWindow messages={[]} currentUserId="me" onSendMessage={vi.fn()} />,
    );
    expect(screen.queryByText('Charger plus de messages')).not.toBeInTheDocument();

    rerender(
      <ChatWindow
        messages={[]}
        currentUserId="me"
        onSendMessage={vi.fn()}
        hasMore
        onLoadMore={onLoadMore}
      />,
    );
    fireEvent.click(screen.getByText('Charger plus de messages'));

    expect(onLoadMore).toHaveBeenCalledTimes(1);
  });

  it('shows "Chargement..." on the load-more button while loading', () => {
    render(
      <ChatWindow
        messages={[]}
        currentUserId="me"
        onSendMessage={vi.fn()}
        hasMore
        loading
        onLoadMore={vi.fn()}
      />,
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });
});

describe('ChatWindow - sending a message', () => {
  it('disables the send button until text is entered', () => {
    render(<ChatWindow messages={[]} currentUserId="me" onSendMessage={vi.fn()} />);

    expect(screen.getByRole('button', { name: 'Envoyer le message' })).toBeDisabled();
  });

  it('sends the trimmed message on submit and clears the input', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<ChatWindow messages={[]} currentUserId="me" onSendMessage={onSendMessage} />);

    fireEvent.change(screen.getByPlaceholderText('Écrivez votre message...'), {
      target: { value: '  Bonjour  ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith('Bonjour'));
    await waitFor(() =>
      expect(screen.getByPlaceholderText('Écrivez votre message...')).toHaveValue(''),
    );
  });

  it('sends the message when Enter is pressed without Shift', async () => {
    const onSendMessage = vi.fn().mockResolvedValue(undefined);
    render(<ChatWindow messages={[]} currentUserId="me" onSendMessage={onSendMessage} />);

    const textarea = screen.getByPlaceholderText('Écrivez votre message...');
    fireEvent.change(textarea, { target: { value: 'Salut' } });
    fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter', charCode: 13 });

    await waitFor(() => expect(onSendMessage).toHaveBeenCalledWith('Salut'));
  });

  it('does not send when Shift+Enter is pressed', () => {
    const onSendMessage = vi.fn();
    render(<ChatWindow messages={[]} currentUserId="me" onSendMessage={onSendMessage} />);

    const textarea = screen.getByPlaceholderText('Écrivez votre message...');
    fireEvent.change(textarea, { target: { value: 'Salut' } });
    fireEvent.keyPress(textarea, { key: 'Enter', code: 'Enter', charCode: 13, shiftKey: true });

    expect(onSendMessage).not.toHaveBeenCalled();
  });

  it('does not send an empty or whitespace-only message', () => {
    const onSendMessage = vi.fn();
    render(<ChatWindow messages={[]} currentUserId="me" onSendMessage={onSendMessage} />);

    fireEvent.change(screen.getByPlaceholderText('Écrivez votre message...'), {
      target: { value: '   ' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer le message' }));

    expect(onSendMessage).not.toHaveBeenCalled();
  });
});
