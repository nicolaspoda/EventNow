import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EditConversationModal } from '../components/messages/EditConversationModal';
import { ConversationType } from '../services/messageService';
import type { Conversation } from '../services/messageService';

vi.mock('../components/upload/ImageUpload', () => ({
  ImageUpload: ({ onUploadSuccess }: { onUploadSuccess: (url: string) => void }) => (
    <button onClick={() => onUploadSuccess('https://cdn.example.com/new.png')}>
      Uploader une image
    </button>
  ),
}));

const conversation: Conversation = {
  id: 'c1',
  type: ConversationType.GROUP,
  name: 'Équipe projet',
  imageUrl: 'https://cdn.example.com/old.png',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  members: [],
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('EditConversationModal', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(
      <EditConversationModal isOpen={false} onClose={vi.fn()} conversation={conversation} onUpdate={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it('pre-fills the name field with the conversation name', () => {
    render(
      <EditConversationModal isOpen onClose={vi.fn()} conversation={conversation} onUpdate={vi.fn()} />,
    );

    expect(screen.getByLabelText('Nom du groupe')).toHaveValue('Équipe projet');
  });

  it('shows a "remove image" link only when an image is set', () => {
    render(
      <EditConversationModal
        isOpen
        onClose={vi.fn()}
        conversation={{ ...conversation, imageUrl: undefined }}
        onUpdate={vi.fn()}
      />,
    );

    expect(screen.queryByText("Supprimer l'image")).not.toBeInTheDocument();
  });

  it('removes the image when "Supprimer l\'image" is clicked', () => {
    render(
      <EditConversationModal isOpen onClose={vi.fn()} conversation={conversation} onUpdate={vi.fn()} />,
    );

    fireEvent.click(screen.getByText("Supprimer l'image"));

    expect(screen.queryByText("Supprimer l'image")).not.toBeInTheDocument();
  });

  it('updates the image when a new upload succeeds', () => {
    render(
      <EditConversationModal isOpen onClose={vi.fn()} conversation={conversation} onUpdate={vi.fn()} />,
    );

    fireEvent.click(screen.getByText('Uploader une image'));

    expect(screen.getByText("Supprimer l'image")).toBeInTheDocument();
  });

  it('alerts and does not submit when the name is empty', () => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    const onUpdate = vi.fn();
    render(
      <EditConversationModal
        isOpen
        onClose={vi.fn()}
        conversation={{ ...conversation, name: '' }}
        onUpdate={onUpdate}
      />,
    );

    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled();
    expect(onUpdate).not.toHaveBeenCalled();
  });

  it('submits the updated name and image, then closes', async () => {
    const onUpdate = vi.fn().mockResolvedValue(undefined);
    const onClose = vi.fn();
    render(
      <EditConversationModal isOpen onClose={onClose} conversation={conversation} onUpdate={onUpdate} />,
    );

    fireEvent.change(screen.getByLabelText('Nom du groupe'), { target: { value: 'Nouvelle équipe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }));

    await waitFor(() =>
      expect(onUpdate).toHaveBeenCalledWith('Nouvelle équipe', 'https://cdn.example.com/old.png'),
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('resets the form fields to the conversation values whenever it re-opens', () => {
    const { rerender } = render(
      <EditConversationModal isOpen onClose={vi.fn()} conversation={conversation} onUpdate={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText('Nom du groupe'), { target: { value: 'Modifié' } });
    expect(screen.getByLabelText('Nom du groupe')).toHaveValue('Modifié');

    rerender(
      <EditConversationModal isOpen={false} onClose={vi.fn()} conversation={conversation} onUpdate={vi.fn()} />,
    );
    rerender(
      <EditConversationModal isOpen onClose={vi.fn()} conversation={conversation} onUpdate={vi.fn()} />,
    );

    expect(screen.getByLabelText('Nom du groupe')).toHaveValue('Équipe projet');
  });

  it('calls onClose when cancel is clicked', () => {
    const onClose = vi.fn();
    render(
      <EditConversationModal isOpen onClose={onClose} conversation={conversation} onUpdate={vi.fn()} />,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));

    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
