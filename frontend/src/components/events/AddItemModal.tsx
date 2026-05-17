import React, { useState } from 'react';
import Button from '../ui/Button';
import type { CreateItemDto } from '../../services/eventItemsService';

interface Props {
  onSubmit: (dto: CreateItemDto) => Promise<void>;
  onClose: () => void;
}

const AddItemModal: React.FC<Props> = ({ onSubmit, onClose }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('');
  const [note, setNote] = useState('');
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
      setError("Erreur lors de l'ajout de l'article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-item-title"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white dark:bg-neutral-800 rounded-2xl shadow-2xl max-w-md w-full p-6">
        <h2
          id="add-item-title"
          className="text-xl font-bold text-neutral-900 dark:text-neutral-100 mb-5"
        >
          Ajouter un article
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="item-name"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Nom <span className="text-error-500">*</span>
            </label>
            <input
              id="item-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Chips, Ballon, Nappe..."
              maxLength={100}
              required
              className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div className="flex gap-3">
            <div className="flex-1">
              <label
                htmlFor="item-quantity"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Quantité
              </label>
              <input
                id="item-quantity"
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="item-unit"
                className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
              >
                Unité
              </label>
              <input
                id="item-unit"
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="Ex: kg, L, bouteilles..."
                maxLength={20}
                className="w-full rounded-lg border border-neutral-300 dark:border-neutral-600 bg-white dark:bg-neutral-700 text-neutral-900 dark:text-neutral-100 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="item-note"
              className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1"
            >
              Précisions
            </label>
            <textarea
              id="item-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Précisions sur l'article..."
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
              {loading ? 'Ajout...' : 'Ajouter à la liste'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddItemModal;
