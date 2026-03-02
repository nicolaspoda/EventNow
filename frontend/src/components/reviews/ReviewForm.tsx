import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { reviewService } from '../../services/reviewService';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';

interface ReviewFormProps {
  eventId: string;
  onSuccess: () => void;
}

export const ReviewForm: React.FC<ReviewFormProps> = ({
  eventId,
  onSuccess,
}) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      setError('Veuillez sélectionner une note');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await reviewService.createReview(eventId, { rating, comment });
      onSuccess();
      setRating(0);
      setComment('');
    } catch (err: any) {
      setError(getApiErrorMessage(err, "Erreur lors de la création de l'avis"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6">
      <h3 className="text-xl font-semibold mb-4">Laisser un avis</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Note globale
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="mb-4">
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Votre avis (optionnel)
        </label>
        <textarea
          id="comment"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={4}
          maxLength={1000}
          placeholder="Partagez votre expérience..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
        />
        <p className="text-xs text-gray-500 mt-1">
          {comment.length}/1000 caractères
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || rating === 0}
        className="w-full bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'Publication...' : 'Publier mon avis'}
      </button>
    </form>
  );
};
