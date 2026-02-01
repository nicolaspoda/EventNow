import React, { useState } from 'react';
import type { TicketCategory } from '../../types/event.types';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Button from '../ui/Button';

interface BookingModalProps {
  category: TicketCategory;
  eventTitle: string;
  onClose: () => void;
  onConfirm: (quantity: number) => Promise<void>;
}

const BookingModal: React.FC<BookingModalProps> = ({
  category,
  eventTitle,
  onClose,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const maxQuantity = Math.min(category.currentStock, 10);
  const totalPrice = Number(category.price) * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await onConfirm(quantity);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la réservation'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 id="modal-title" className="text-2xl font-bold text-gray-900">
            Réserver des billets
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label="Fermer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mb-6">
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Événement :</span> {eventTitle}
          </p>
          <p className="text-gray-700 mb-2">
            <span className="font-semibold">Catégorie :</span> {category.name}
          </p>
          {category.description && (
            <p className="text-gray-600 text-sm mb-2">{category.description}</p>
          )}
          <p className="text-gray-700">
            <span className="font-semibold">Prix unitaire :</span> {Number(category.price).toFixed(2)} €
          </p>
          <p className="text-gray-700">
            <span className="font-semibold">Places disponibles :</span> {category.currentStock}
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de billets
            </label>
            <input
              type="number"
              id="quantity"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(maxQuantity, parseInt(e.target.value) || 1)))}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <p className="text-sm text-gray-500 mt-1">
              Maximum {maxQuantity} billets par réservation
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-gray-900">Total</span>
              <span className="text-2xl font-bold text-blue-600">
                {totalPrice.toFixed(2)} €
              </span>
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-6">
            <p className="text-sm text-blue-800">
              Vous aurez <span className="font-semibold">10 minutes</span> pour finaliser votre paiement après la réservation.
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              fullWidth
            >
              Annuler
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading || category.currentStock === 0}
              fullWidth
            >
              {loading ? 'Réservation...' : 'Réserver'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BookingModal;
