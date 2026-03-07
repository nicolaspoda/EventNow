import React, { useState } from 'react';
import { StarRating } from './StarRating';
import { reviewService } from '../../services/reviewService';
import { getApiErrorMessage } from '../../utils/getApiErrorMessage';
import Button from '../ui/Button';

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
    <form onSubmit={handleSubmit} className="glass-card p-6">
      <h3 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100 mb-4">Laisser un avis</h3>

      <div className="mb-4">
        <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2">
          Note globale
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" />
      </div>

      <div className="mb-4">
        <label
          htmlFor="comment"
          className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-2"
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
          className="w-full px-4 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg bg-white dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 focus:ring-2 focus:ring-primary-500 focus:outline-none"
        />
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
          {comment.length}/1000 caractères
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-error-50 dark:bg-error-900/20 border border-error-200 dark:border-error-800 rounded-lg text-error-700 dark:text-error-300 text-sm">
          {error}
        </div>
      )}

      <Button
        type="submit"
        variant="primary"
        fullWidth
        disabled={loading || rating === 0}
      >
        {loading ? 'Publication...' : 'Publier mon avis'}
      </Button>
    </form>
  );
};
