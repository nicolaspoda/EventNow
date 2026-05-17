import React, { useState } from 'react';
import Button from '../ui/Button';
import type { EventItem, UpdateItemDto } from '../../services/eventItemsService';

interface Props {
  item: EventItem;
  onSubmit: (dto: UpdateItemDto) => Promise<void>;
  onClose: () => void;
}

const EditItemModal: React.FC<Props> = ({ item, onSubmit, onClose }) => {
  const [name, setName] = useState(item.name);
  const [quantity, setQuantity] = useState(item.quantity);
  const [unit, setUnit] = useState(item.unit ?? '');
  const [note, setNote] = useState(item.note ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await onSubmit({
        name: name.trim(),
        quantity,
        unit: unit.trim() || undefined,
        note: note.trim() || undefined,
      });
      onClose();
    } catch {
      setError("Erreur lors de la modification de l'article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-item-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2
          id="edit-item-title"
          className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-5"
        >
          Modifier l'article
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="edit-item-name"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Nom <span className="text-error-500">*</span>
            </label>
            <input
              id="edit-item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              required
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="edit-item-quantity"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Quantité
              </label>
              <input
                id="edit-item-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) =>
                  setQuantity(Math.max(1, parseInt(e.target.value) || 1))
                }
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="edit-item-unit"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Unité
              </label>
              <input
                id="edit-item-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="kg, L, bouteilles..."
                maxLength={20}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="edit-item-note"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Précisions
            </label>
            <textarea
              id="edit-item-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={200}
              rows={2}
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
            />
          </div>

          {error && (
            <p className="text-sm text-error-600 dark:text-error-400" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3 justify-end pt-1">
            <Button variant="ghost" type="button" onClick={onClose} disabled={loading}>
              Annuler
            </Button>
            <Button variant="primary" type="submit" disabled={loading || !name.trim()}>
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditItemModal;
