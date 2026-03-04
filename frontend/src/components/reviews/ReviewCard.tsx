import React from 'react';
import { StarRating } from './StarRating';

interface Review {
  id: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  user: {
    email: string;
  };
}

interface ReviewCardProps {
  review: Review;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({
  review,
  isOwner = false,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="glass-card p-6">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <div className="w-10 h-10 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center text-primary-600 dark:text-primary-400 font-semibold flex-shrink-0">
              {review.user.email[0].toUpperCase()}
            </div>
            <div>
              <p className="font-medium text-neutral-900 dark:text-neutral-100">{review.user.email}</p>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {new Date(review.createdAt).toLocaleDateString('fr-FR', {
                  day: '2-digit',
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
            </div>
          </div>
          <StarRating value={review.rating} readonly size="sm" />
        </div>

        {isOwner && (
          <div className="flex space-x-2">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-primary-600 dark:text-primary-400 hover:text-primary-700 dark:hover:text-primary-300 text-sm font-medium"
              >
                Modifier
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-error-600 dark:text-error-400 hover:text-error-700 dark:hover:text-error-300 text-sm font-medium"
              >
                Supprimer
              </button>
            )}
          </div>
        )}
      </div>

      {review.comment && (
        <p className="text-neutral-700 dark:text-neutral-300 mt-3 leading-relaxed">{review.comment}</p>
      )}
    </div>
  );
};
