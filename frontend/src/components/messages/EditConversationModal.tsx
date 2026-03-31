import React, { useState, useEffect } from 'react';
import Button from '../ui/Button';
import { Input } from '../ui/Input';
import { ImageUpload } from '../upload/ImageUpload';
import type { Conversation } from '../../services/messageService';

interface EditConversationModalProps {
  isOpen: boolean;
  onClose: () => void;
  conversation: Conversation;
  onUpdate: (name: string, imageUrl?: string) => Promise<void>;
}

export const EditConversationModal: React.FC<EditConversationModalProps> = ({
  isOpen,
  onClose,
  conversation,
  onUpdate,
}) => {
  const [name, setName] = useState(conversation.name || '');
  const [imageUrl, setImageUrl] = useState(conversation.imageUrl || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(conversation.name || '');
      setImageUrl(conversation.imageUrl || '');
    }
  }, [isOpen, conversation]);

  if (!isOpen) return null;

  const handleUpdate = async () => {
    if (!name.trim()) {
      alert('Le nom est requis');
      return;
    }

    setLoading(true);
    try {
      await onUpdate(name, imageUrl || undefined);
      onClose();
    } catch (error) {
      console.error('Erreur lors de la modification:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-neutral-800 rounded-2xl shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b border-neutral-200 dark:border-neutral-700">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Modifier la conversation
            </h2>
            <button
              onClick={onClose}
              className="text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label htmlFor="conversation-name" className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
              Nom du groupe
            </label>
            <Input
              id="conversation-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Équipe projet"
              className="w-full"
            />
          </div>

          <div>
            <ImageUpload
              currentImage={imageUrl || undefined}
              onUploadSuccess={(url) => setImageUrl(url)}
              label="Image du groupe (optionnel)"
              maxSize={2}
            />
            {imageUrl && (
              <button
                type="button"
                onClick={() => setImageUrl('')}
                className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                Supprimer l'image
              </button>
            )}
          </div>
        </div>

        <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-900 border-t border-neutral-200 dark:border-neutral-700 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Annuler
          </Button>
          <Button
            variant="primary"
            onClick={handleUpdate}
            loading={loading}
            disabled={loading || !name.trim()}
          >
            Enregistrer
          </Button>
        </div>
      </div>
    </div>
  );
};
